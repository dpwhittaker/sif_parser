const fs = require('fs');

let messages = JSON.parse(fs.readFileSync(`piggs/clientmessages.json`));

cleanupFile('powers');
cleanupFile('powersets');
cleanupFile('powercats', true);
cleanupFile('classes', true);

function cleanupFile(file, skipCats) {
    let things = JSON.parse(fs.readFileSync(`piggs/${file}.json`));
    let dflt = removeDefaults(things);
    fs.writeFileSync(`docs/${file}.json`, JSON.stringify(things));
    fs.writeFileSync(`docs/${file}.default.json`, JSON.stringify(dflt, null, 2));
    if (skipCats) return;
    let categories = {};
    for (let thing of things) {
        let category = thing.full_name.split('.')[0];
        if (!categories[category])
            categories[category] = [];
        categories[category].push(thing);
    }
    for (let category in categories) {
        console.log(category);
        fs.writeFileSync(`docs/${file}/${category}.json`, JSON.stringify(categories[category], null, 2));
    }
}

function removeDefaults(objects) {
    let dflt = {};
    let fields = new Set();
    for (let object of objects) for (let field in object) fields.add(field);
    for (let field of fields) {
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
            if (value.startsWith("[{")) arrayOfObjects = true;
            if (value.startsWith("{")) isObject = true;
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
