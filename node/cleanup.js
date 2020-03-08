const fs = require('fs');

let powers = JSON.parse(fs.readFileSync('../powers.json'));
let defpower = removeDefaults(powers);

let categories = {};
for (let power of powers) {
    let category = power.full_name.split('.')[0];
    if (!categories[category]) categories[category] = [];
    categories[category].push(power);
}

fs.writeFileSync("../powers.clean.json", JSON.stringify(powers, null, 2));
fs.writeFileSync("../powers.default.json", JSON.stringify(defpower, null, 2));

for (let category in categories) {
    console.log(category);
    fs.writeFileSync(`docs/powers.${category}.json`, JSON.stringify(categories[category], null, 2));
}

function removeDefaults(objects) {
    let dflt = {};
    for (let field in objects[0]) {
        let values = {};
        let bestCount = 0;
        let bestValue = null;
        let count = 0;
        for (let object of objects) {
            if (!object) continue;
            let value = JSON.stringify(object[field]);
            if (!value) continue;
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
            if (bestValue.startsWith("[")) {
                console.log(field);
                dflt[field] = removeDefaults(objects.flatMap(o => o[field]).filter(o => o));
            }
            else if (bestValue.startsWith("{")) {
                console.log(field);
                dflt[field] = removeDefaults(objects.map(o => o[field]).filter(o => o));
            }
            else {
                console.log(`${field}: ${bestValue} (${bestCount} out of ${count} - not enough)`);
            }
        }
    }
    return dflt;
}
