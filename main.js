function main() {
    
    window.soal_data = [];

    [
        { name: "SalinSemua", onclick: SalinSemua },
        { name: "SalinSaatIni", onclick: SalinSoalSaatIni },
        { name: "Salin(FirstHalf)", onclick: SalinFirstHalf },
        { name: "Salin(LastHalf)", onclick: SalinLastHalf },
        { name: "SalinFormData", onclick: SalinFormData },
        { name: "TerapkanFormData", onclick: TerapkanFormData },
        { name: "BandingkanFormData", onclick: BandingkanFormData },
        { name: "SalinSemua[Promp]", onclick: SalinSemuaDenganPromp },
        { name: "SalinPromp[AI]", onclick: SalinPrompAI },
        { name: "Terapkan[AI]", onclick: TerapkanAI },
        { name: "TerapkanMulti[AI]", onclick: TerapkanMultiAI },
        // { name: "[NEW] Auto WIN", onclick: AutoWIN },
        { name: "[NEW] Max WIN", onclick: MaxWIN },
    ].forEach(({ name, onclick }) => {
        $("<div>")
            .addClass("btn btn-info")
            .text(name)
            .on("click", onclick)
            .appendTo("#collapseExample");
    });

    $(".panel-body .step").each(function () {
        const soal_elmt = $(this).clone();
        const funkyradio = soal_elmt.find(".funkyradio");

        if (funkyradio.length) {
            const pilihan_elmt = funkyradio.clone();
            funkyradio.remove();

            let jawaban = [];
            pilihan_elmt.find("label").each(function () {
                jawaban.push(extractTextAndImages(this));
            });

            window.soal_data.push({
                soal: extractTextAndImages(soal_elmt[0]),
                jawaban
            });
        }
    });

    function soalObjectToText(soal_data, no) {
        return `${no ? no + ". " : ""}${soal_data.soal}\n${soal_data.jawaban.join("\n")}`;
    }

    function SalinSemua() {
        if (!window.soal_data.length) {
            alert("Data soal belum tersedia!");
            return;
        }
        const result = window.soal_data
            .map((s, i) => soalObjectToText(s, i + 1))
            .join("\n\n");
        navigator.clipboard.writeText(result);
    }

    function SalinSoalSaatIni() {
        if (!window.soal_data.length) {
            alert("Data soal belum tersedia!");
            return;
        }
        const index = +($("#soalke").text() || 1) - 1;
        if (index < 0 || index >= window.soal_data.length) {
            alert("Nomor soal tidak valid!");
            return;
        }
        const result = soalObjectToText(window.soal_data[index], index + 1);
        navigator.clipboard.writeText(result);
    }

    function SalinFirstHalf() {
        if (!window.soal_data.length) {
            alert("Data soal belum tersedia!");
            return;
        }
        const half = Math.floor(window.soal_data.length / 2);
        const result = window.soal_data
            .slice(0, half)
            .map((s, i) => soalObjectToText(s, i + 1))
            .join("\n\n");
        navigator.clipboard.writeText(result);
    }

    function SalinLastHalf() {
        if (!window.soal_data.length) {
            alert("Data soal belum tersedia!");
            return;
        }
        const half = Math.floor(window.soal_data.length / 2);
        const result = window.soal_data
            .slice(half)
            .map((s, i) => soalObjectToText(s, half + i + 1))
            .join("\n\n");
        navigator.clipboard.writeText(result);
    }

    function SalinFormData() {
        const data = window.getFormData($("#_form"));
        navigator.clipboard.writeText(JSON.stringify(data));
    }

    function TerapkanFormData() {
        const local_form = window.getFormData($("#_form"));
        const input = prompt("Masukkan Form Data:");
        if (!input) return;

        let data_form = [];
        try {
            data_form = Object.entries(JSON.parse(input));
        } catch (e) {
            alert("Format Form Data tidak valid!");
            return;
        }

        const data_simpan = [];

        for (const [k, v] of Object.entries(local_form)) {
            if (!k.startsWith("id_soal_")) continue;

            const jwb_id = data_form.find(([_, val]) => val === v);
            if (!jwb_id) continue;

            const jawaban = data_form.find(([key]) => `opsi_${jwb_id[0].substring(8)}` === key);
            if (!jawaban) continue;

            document.getElementById(`opsi_${jawaban[1]}_${v}`).checked = true;
        }

        window.simpan();
    }

    async function AutoWIN() {
        const local_form = window.getFormData($("#_form"));
        let data_form = [];

        try {
            const response = await fetch('https://raw.githubusercontent.com/Natt2k/siatex-tools/main/2025.json');

            const json_data = await response.json();
            data_form = Object.entries(json_data);
        } catch (e) {
            alert("Format Form Data tidak valid!");
            return;
        }

        const data_simpan = [];

        for (const [k, v] of Object.entries(local_form)) {
            if (!k.startsWith("id_soal_")) continue;

            const jwb_id = data_form.find(([_, val]) => val === v);
            if (!jwb_id) continue;

            const jawaban = data_form.find(([key]) => `opsi_${jwb_id[0].substring(8)}` === key);
            if (!jawaban) continue;

            document.getElementById(`opsi_${jawaban[1]}_${v}`).checked = true;
        }

        window.simpan();
    }

    async function MaxWIN() {
        const local_form = window.getFormData($("#_form"));
        let data_form = {};

        try {
            const response = await fetch('https://raw.githubusercontent.com/Natt2k/siatex-tools/main/options_2025.json');

            const json_data = await response.json();
            data_form = json_data;
        } catch (e) {
            alert("Format Form Data tidak valid!");
            return;
        }

        const data_simpan = [];

        for (const [k, v] of Object.entries(local_form)) {
            if (!k.startsWith("id_soal_")) continue;
            if (!data_form.hasOwnProperty(v)) continue;

            const jawaban = data_form[v];

            document.getElementById(`opsi_${jawaban}_${v}`).checked = true;
        }

        window.simpan();
    }

    function BandingkanFormData() {
        const local_form = window.getFormData($("#_form"));
        const input = prompt("Masukkan Form Data:");
        if (!input) return;

        let data_form;
        try {
            data_form = Object.entries(JSON.parse(input));
        } catch (e) {
            alert("Format Form Data tidak valid!");
            return;
        }

        const data_simpan = [];

        for (const [k, v] of Object.entries(local_form)) {
            if (!k.startsWith("id_soal_")) continue;

            const jwb_id = data_form.find(([_, val]) => val === v);
            if (!jwb_id) continue;

            const jawaban = data_form.find(([key]) => `opsi_${jwb_id[0].substring(8)}` === key);
            if (!jawaban) continue;

            data_simpan.push({
                id: v,
                no_soal: k.substring(8),
                jawab: jawaban[1]
            });
        }

        navigator.clipboard.writeText(JSON.stringify(data_simpan, null, 2));
    }

    function SalinSemuaDenganPromp() {
        if (!window.soal_data.length) {
            alert("Data soal belum tersedia!");
            return;
        }
        const result = `Jawab dengan format JSON {no_soal: number, jawab: "A","B","C","D","E","Skipped"}[]\n\nSetiap soal tidak memiliki hubungan dengan soal lainnya. Jika pertanyaan tidak jelas atai ragu agau tidak ada jawaban atau meminta gambar tetapi tidak ada gambarnya tinggal pilih skip\n\n`+window.soal_data
            .map((s, i) => soalObjectToText(s, i + 1))
            .join("\n\n");
        navigator.clipboard.writeText(result);
    }

    function SalinPrompAI() {
        const result = `Jawab dengan format JSON {no_soal: number, jawab: "A","B","C","D","E","Skipped"}[]\n\nSetiap soal tidak memiliki hubungan dengan soal lainnya. Jika pertanyaan tidak jelas atai ragu agau tidak ada jawaban atau meminta gambar tetapi tidak ada gambarnya tinggal pilih skip\n\n`;
        navigator.clipboard.writeText(result);
    }

    function TerapkanAI() {
        const local_form = window.getFormData($("#_form"));
        const input = JSON.parse(prompt("Masukkan Jawaban [AI]:"));
        if (!input) return;

        for (const data of input) {
            try {
            if (data.jawab.toUpperCase().length > 1) continue;
            const soal_id = local_form[`id_soal_${data.no_soal}`];
            document.getElementById(`opsi_${data.jawab.toUpperCase()}_${soal_id}`).checked = true; 
            } catch(err) {}
        }

        window.simpan();
    }

    function TerapkanMultiAI() {
        const local_form = window.getFormData($("#_form"));
        const input = JSON.parse("["+prompt("Masukkan Jawaban [1 - 2 AI]:")+"]");
        if (!input || !input.length) return;
        const input2 = JSON.parse("["+prompt("Masukkan Jawaban [0 - 2 AI]:")+"]");
        if (input2 && input2.length) input.push(...input2);

        for (const data of input[0]) {
            try {
            if (data.jawab.toUpperCase().length > 1) continue;
            if (!isJawabanSamaUntukNoSoal(input, data.no_soal)) continue;
            const soal_id = local_form[`id_soal_${data.no_soal}`];
            document.getElementById(`opsi_${data.jawab.toUpperCase()}_${soal_id}`).checked = true; 
            } catch(err) {}
        }

        window.simpan();
    }

    function isJawabanSamaUntukNoSoal(data, noSoal) {
  const jawaban = data
    .flat()
    .filter(item => item.no_soal === noSoal)
    .map(item => item.jawab);

  if (jawaban.length === 0) return false;

  const pertama = jawaban[0];
  return jawaban.every(j => j === pertama);
    }

    function extractTextAndImages(el) {
        let result = "";

        el.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                result += node.textContent.trim() + " ";
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === "IMG") {
                    result += `"${node.src}" `;
                } else {
                    result += extractTextAndImages(node) + " ";
                }
            }
        });

        return result.trim();
    }
}

main();
