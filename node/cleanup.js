const fs = require('fs');

const excludedFields = ['visual_fx','attack_bits','hit_bits','initial_attack_bits',
'attack_fx','hit_fx','initial_attack_fx','continuing_fx','continuing_fx1','mode_bits',
'attack_frames','custom_fx','block_bits','wind_up_bits','death_bits','activation_bits',
'deactivation_bits','activation_fx','deactivation_fx','secondary_attack_fx','wind_up_fx',
'block_fx','death_fx','continuing_fx2','continuing_fx3','continuing_fx4','conditional_fx',
'conditional_fx1','conditional_fx2','conditional_fx3','conditional_fx4',
'frames_before_hit','frames_before_secondary_hit','delayed_hit','attack_frames',
'initial_frames_before_hit','initial_attack_fxframe_delay','projectile_speed',
'secondary_projectile_speed','initial_frames_before_block','ignore_attack_time_errors',
'frames_before_block','fx_important','primary_tint','secondary_tint','fx','continuing_bits',
'conditional_bits','attrib_cache','messages']

let messages = JSON.parse(fs.readFileSync(`piggs/clientmessages.json`));

cleanupFile('powers');
cleanupFile('powersets');
cleanupFile('powercats');
cleanupFile('classes');

function cleanupFile(file) {
    let things = JSON.parse(fs.readFileSync(`piggs/${file}.json`));
    let dflt = removeDefaults(things);
    let categories = {};
    let depth = 0;
    for (let thing of things) {
        let cats = (thing.full_name || thing.name).split('.');
        depth = cats.length;
        delete thing.full_name;
        delete thing.name;
        c = categories;
        for (let i = 0; i < cats.length - 1; i++) {
            if (!c[cats[i]]) c[cats[i]] = {};
            c = c[cats[i]];
        }
        c[cats[cats.length - 1]] = thing;
    }
    fs.writeFileSync(`docs/${file}.json`, JSON.stringify(categories));
    fs.writeFileSync(`docs/${file}.default.json`, JSON.stringify(dflt, null, 2));
    for (let category in categories) {
        console.log(category);
        fs.writeFileSync(`docs/${file}/${category}.json`, JSON.stringify(categories[category], null, 2));
        if (depth === 1) continue;
        for (let powerset in categories[category]) {
            //console.log(`${category}/${powerset}`);
            if (!fs.existsSync(`docs/${file}/${category}`)) fs.mkdirSync(`docs/${file}/${category}`);
            fs.writeFileSync(`docs/${file}/${category}/${powerset}.json`, JSON.stringify(categories[category][powerset], null, 2));
            if (depth === 2) continue;
            for (let power in categories[category][powerset]) {
                //console.log(`${category}/${powerset}/${power}`);
                if (!fs.existsSync(`docs/${file}/${category}/${powerset}`)) fs.mkdirSync(`docs/${file}/${category}/${powerset}`);
                fs.writeFileSync(`docs/${file}/${category}/${powerset}/${power}.json`, JSON.stringify(categories[category][powerset][power], null, 2));
            }
        }
    }
}

function removeDefaults(objects) {
    let dflt = {};
    let fields = new Set();
    for (let object of objects) for (let field in object) fields.add(field);
    for (let field of fields) {
        if (excludedFields.includes(field)) {
            for (let object of objects) delete object[field];
            continue;
        }
        let values = {};
        let bestCount = 0;
        let bestValue = null;
        let count = 0;
        let arrayOfObjects = false;
        let isObject = false;
        if (objects.every(o => Array.isArray(o[field]) && o[field].length < 2)) {
            for (let object of objects) {
                if (object[field].length == 0) object[field] = null;
                else object[field] = object[field][0];
            }
        }
        for (let object of objects) {
            if (!object) continue;
            if (typeof object[field] === 'string' && object[field] in messages)
                object[field] = messages[object[field]];
            if (field === 'mod_table' && object[field]) {
                let obj = {};
                for (let entry of object[field]) obj[entry.name] = entry.values;
                object[field] = obj;
            }
            let value = JSON.stringify(object[field]);
            if (!value) continue;
            if (value.startsWith('[{')) arrayOfObjects = true;
            if (value.startsWith('{')) isObject = true;
            count++;
            if (value in values)
                values[value]++;
            else
                values[value] = 1;
            if (values[value] > bestCount) {
                bestCount = values[value];
                bestValue = value;
            }
        }
        if (bestCount > count * 0.2) {
            console.log(`${field}: ${bestValue} (${bestCount} out of ${count})`);
            dflt[field] = JSON.parse(bestValue);
            for (let object of objects) {
                if (object && JSON.stringify(object[field]) === bestValue)
                    delete object[field];
            }
        } else {
            console.log(`${field}: ${bestValue} (${bestCount} out of ${count} - not enough)`);
        }
        if (arrayOfObjects) {
            if (!dflt.sub) dflt.sub = {};
            console.log(field);
            dflt.sub[field] = removeDefaults(objects.flatMap(o => o[field]).filter(o => o));
        }
        else if (isObject) {
            if (!dflt.sub) dflt.sub = {};
            console.log(field);
            dflt.sub[field] = removeDefaults(objects.map(o => o[field]).filter(o => o));
        }
    }
    return dflt;
}
