use index_datamanip::*;
use serde_json;
use std::fs;
use std::error::Error;
use std::fmt::Debug;
use serde::Serialize;
use serde::de::DeserializeOwned;

fn main() -> Result<(), Box<dyn Error>> {
    let bin = Pigg::new("piggs/bin.pigg")?;
    let binpowers = Pigg::new("piggs/bin_powers.pigg")?;

    let messbin = bin.get_data("bin/clientmessages-en.bin")?;
    let messages = parse_messages::get_pmessages(&messbin)?;
    fs::write("piggs/clientmessages.json", &serde_json::to_string(&messages)?)?;
    
    convert::<objects::Power>(&binpowers, "powers")?;
    convert::<objects::Powerset>(&bin, "powersets")?;
    convert::<objects::PowerCategory>(&bin, "powercats")?;
    convert::<objects::Class>(&bin, "classes")?;
    
    Ok(())
}

fn convert<T: DeserializeOwned + Serialize + Debug>(pigg: &Pigg, file: &str) -> Result<(), Box<dyn Error>> {
    println!("{}", file);

    let bin = pigg.get_data(&format!("bin/{}.bin", file))?;
    let things = defs::decode::<T>(&bin)?;
    fs::write(&format!("piggs/{}.json", file), &serde_json::to_string(&things)?)?;

    Ok(())
}