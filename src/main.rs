use index_datamanip::*;
use serde_json;
use std::fs;

fn main() {
    println!("Hello, world!");
    let bin = match Pigg::new("../bin.pigg") {
        Ok(bin) => bin,
        Err(error) => panic!("Problem opening bin pigg: {:?}", error)
    };
    let messbin = match bin.get_data("bin/clientmessages-en.bin") {
        Ok(mb) => mb,
        Err(error) => panic!("Problem loading clientmessages: {:?}", error)
    };
    let messages = match parse_messages::get_pmessages(&messbin) {
        Ok(m) => m,
        Err(error) => panic!("Problem loading messages: {:?}", error)
    };
    //for (key, val) in messages.iter() { println!("Got: {}: {}", key, val); }
    let binpowers = match Pigg::new("../bin_powers.pigg") {
        Ok(bin) => bin,
        Err(error) => panic!("Problem opening powers pigg: {:?}", error)
    };
    let powersbin = match binpowers.get_data("bin/powers.bin") {
        Ok(pb) => pb,
        Err(error) => panic!("Problem loading powers: {:?}", error)
    };
    let mut powers = match defs::decode::<objects::Power>(&powersbin) {
        Ok(p) => p,
        Err(error) => panic!("Problem decoding powers: {:?}", error)
    };
    for power in powers.iter_mut() { power.fix_strings(&messages); }
    let json = match serde_json::to_string_pretty(&powers) {
        Ok(j) => j,
        Err(error) => panic!("Problem serializing powers: {:?}", error)
    };
    match fs::write("../powers.json", &json) {
        Ok(_) => println!("wrote powers.json"),
        Err(error) => panic!("Problem writing powers.json: {:?}", error)
    };
    //for val in powers.iter() { println!("Got: {}", val); }
}
