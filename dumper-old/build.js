const fs = require("fs");
const path = require("path");

const rawfile = fs.readFileSync(__dirname + "/dump/result.md", "utf-8");

const lines = rawfile.split("\n").filter(line => line.trim() !== "");

let jsonData = {};

lines.slice(2).forEach((line) => {
    const parts = line.split("|").map(part => part.trim());

    jsonData[parts[0]] = parts[1];
});

fs.writeFileSync(path.join(__dirname, "..", "options_2025.json"), JSON.stringify(jsonData, null, 2), "utf-8");