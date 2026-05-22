<?php

$PRODUCERS = [
    ["name" => "Atom",      "desc" => "+0.1 kg/s",  "baseRate" => 0.1,  "baseCost" => 10],
    ["name" => "Molekyl",   "desc" => "+1 kg/s",    "baseRate" => 1,    "baseCost" => 75],
    ["name" => "Partikel",  "desc" => "+10 kg/s",   "baseRate" => 10,   "baseCost" => 500],
    ["name" => "Asteroid",  "desc" => "+80 kg/s",   "baseRate" => 80,   "baseCost" => 3000],
    ["name" => "Svart hal", "desc" => "+500 kg/s",  "baseRate" => 500,  "baseCost" => 20000]
];

$UPGRADES = [
    ["name" => "Bättre grepp",      "desc" => "x2 per klick",  "cost" => 50,     "type" => "click",    "mult" => 2],
    ["name" => "Kraftfulla atomer", "desc" => "Atomer x2",     "cost" => 200,    "type" => "producer", "target" => 0, "mult" => 2],
    ["name" => "Dubbelklick",       "desc" => "x2 per klick",  "cost" => 500,    "type" => "click",    "mult" => 2],
    ["name" => "Starka molekyler",  "desc" => "Molekyler x2",  "cost" => 2000,   "type" => "producer", "target" => 1, "mult" => 2],
    ["name" => "Massans lag",       "desc" => "x3 per klick",  "cost" => 5000,   "type" => "click",    "mult" => 3],
    ["name" => "Starka partiklar",  "desc" => "Partiklar x2",  "cost" => 15000,  "type" => "producer", "target" => 2, "mult" => 2],
    ["name" => "Kvantgrepp",        "desc" => "x5 per klick",  "cost" => 50000,  "type" => "click",    "mult" => 5],
    ["name" => "Svart hals kraft",  "desc" => "Svart hal x2",  "cost" => 200000, "type" => "producer", "target" => 4, "mult" => 2]
];

$PRESTIGE_REQUIREMENT = 1000000;