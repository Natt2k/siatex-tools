(function() {
    if (localStorage.getItem("isVerified") !== "true") {
      alert("Anda belum terverifikasi!");
      return;
    }
    if (typeof window.ExamData === 'undefined' || !window.ExamData.soal) return;
    const examData = window.ExamData;
    const soalList = examData.soal;
    const orderedIds = soalList.map(s => s.id);
    const csrf = examData.csrf;
    const saveUrl = examData.save_url;
    const soalIds = orderedIds.filter(id => id !== null);
    async function sendJawaban(idSoal, jawabanHuruf) {
        const formData = new FormData();
        formData.append('_token', csrf);
        formData.append('id_soal', idSoal);
        formData.append('jawaban_siswa', jawabanHuruf || '');
        formData.append('jawaban_esai', '');
        formData.append('ragu_ragu', '0');
        try {
            const response = await fetch(saveUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            return response.ok && (data.success || data.success === undefined);
        } catch (error) {
            return false;
        }
    }
    async function maxWin() {
        const url = 'https://raw.githubusercontent.com/Natt2k/siatex-tools/main/answers/answers.json';
        try {
            const response = await fetch(url);
            if (!response.ok) return;
            const jawabanMap = await response.json();
            for (const idSoal of soalIds) {
                const jawaban = jawabanMap[idSoal];
                if (!jawaban) continue;
                await sendJawaban(idSoal, jawaban);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            location.reload();
        } catch (error) {}
    }
    maxWin();
})();
