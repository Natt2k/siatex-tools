const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { argv } = require('process');

const cookie = argv[2];
const save_path = path.join(__dirname, "..", "answers", "answers.json");

console.log(cookie);

if (!cookie) {
    console.log(`[Dumper] Cookie data not found! Try 'node index.js "YOUR COOKIE DATA HERE"'`);
    return;
}

console.log(`[Dumper] Fetching mapel ids...`);

axios.get('https://siatex.smktexmaco-smg.sch.id/siatexadm/', {
    timeout: 10000,
    headers: {
        'Cookie': cookie,
    },
    params: {
        page: 'soal'
    }
}).then(async (res) => {
    const rawres = res.data;
    const idx1 = rawres.indexOf("<tbody>");
    const idx2 = rawres.indexOf("</tbody>");
    // const data = rawres.substring(idx1, idx2).split("soal&idmap=").map(v => v.slice(0, v.indexOf('"')));
    // data.shift();
    const data = extractMapData(rawres.substring(idx1, idx2).slice(7));

    console.log(`[Dumper] ${data.length} Mapel Founded!`);

    let result = {};

    for (const [idmap, namap] of data) {
        console.log(`[Dumper] Fetching answers for ${namap} [${idmap}] ...`);

        try {
            const answers = await getMapelAnswers(idmap);

            result = { ...result, ...answers };

            const amount = Object.keys(answers).length;

            console.log(`[Dumper] Stored ${amount} answers from ${namap}!`);
        } catch(err) {
            console.log(`[Dumper] Failed to get answers from ${namap}!`);
            console.error(err);
        }
    }

    const amount = Object.keys(result).length;
    
    console.log(`[Dumper] Founded ${amount} answers!`);
    console.log(`[Dumper] Saving answers...`);

    fs.writeFile(save_path, JSON.stringify(result, undefined, 4), "utf-8", (err) => {
        if (err) {
            console.log(`[Dumper] Failed to save!`)
            console.error(err);
            return;
        }
        
        console.log(`[Dumper] ${amount} answers saved!`, `[${save_path}]`);
    });
}).catch((err) => {
    console.log(`[Dumper] Failed to get mapel ids!`);
    console.error(err);
});

async function getMapelAnswers(idmap) {
    try {
        const response = await axios.get('https://siatex.smktexmaco-smg.sch.id/siatexadm/', {
            timeout: 10000,
            headers: {
                'Cookie': cookie,
            },
            params: {
                page: 'soal',
                act: 'soal',
                idmap
            }
        });

        if (response.status !== 200) throw new Error(`Invalid status! ${response.status}`);

        const rawdata = response.data;
        const htmlString = rawdata.substring(rawdata.indexOf('<tbody>') + 7, rawdata.indexOf('</tbody>'));

        return extractAnswers(htmlString);
    } catch (err) {
        throw err;
    }
}

function extractMapData(htmlString) {
    const result = [];
    
    const rows = htmlString.split('<tr').slice(1); 
    
    rows.forEach(row => {
        const tdMatches = row.match(/<td[^>]*>(.*?)<\/td>/gs);
        
        if (tdMatches && tdMatches.length >= 6) {
            const td2Content = tdMatches[1];
            const namaMapel = td2Content.replace(/<[^>]+>/g, '').trim();
            
            const td6Content = tdMatches[5];
            const idmapMatch = td6Content.match(/idmap=(\d+)/);
            const idmapValue = idmapMatch ? idmapMatch[1] : null;
            
            if (namaMapel && idmapValue) {
                result.push([idmapValue, namaMapel]);
            }
        }
    });
    
    return result;
}

function extractAnswers(htmlString) {
    const result = {};
    
    const rows = htmlString.split('<tr').slice(1);
    
    rows.forEach(row => {
        const tdMatches = row.match(/<td[^>]*>(.*?)<\/td>/gs);
        
        if (tdMatches && tdMatches.length >= 12) {
            const td5Content = tdMatches[4];
            const bracketMatch = td5Content.match(/\(([A-E])\)/);
            const letter = bracketMatch ? bracketMatch[1] : null;
            
            const td12Content = tdMatches[11];
            const kdMatch = td12Content.match(/kd=(\d+)/);
            const kdValue = kdMatch ? kdMatch[1] : null;
            
            if (letter && kdValue) {
                result[kdValue] = letter;
            }
        }
    });
    
    return result;
}