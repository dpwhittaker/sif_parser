use index_datamanip::*;
use serde_json;
use std::fs;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let bin = Pigg::new("piggs/bin.pigg")?;
    let binpowers = Pigg::new("piggs/bin_powers.pigg")?;

    let messbin = bin.get_data("bin/clientmessages-en.bin")?;
    let messages = parse_messages::get_pmessages(&messbin)?;
    //for (key, val) in messages.iter() { println!("Got: {}: {}", key, val); }

    let powersbin = binpowers.get_data("bin/powers.bin")?;
    let mut powers = defs::decode::<objects::Power>(&powersbin)?;
    for power in powers.iter_mut() { power.fix_strings(&messages); }
    let mut json = serde_json::to_string(&powers)?;
    fs::write("piggs/powers.json", &json)?;
    //for val in powers.iter() { println!("Got: {}", val); }

    let powersetsbin = bin.get_data("bin/powersets.bin")?;
    let mut powersets = defs::decode::<objects::Powerset>(&powersetsbin)?;
    for powerset in powersets.iter_mut() { powerset.fix_strings(&messages); }
    json = serde_json::to_string(&powersets)?;
    fs::write("piggs/powersets.json", &json)?;
    //for val in powers.iter() { println!("Got: {}", val); }
    
    Ok(())
}
