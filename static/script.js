// ===== Elements =====
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const dropZoneText = document.getElementById('drop-zone-text');
const form = document.getElementById('upload-form');

// ===== Toast Function =====
function showToast(message, type = "") {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.className = "show " + type;

    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 2500);
}

// ===== Drag & Drop =====
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    fileInput.files = e.dataTransfer.files;

    if (fileInput.files.length > 0) {
        dropZoneText.textContent = fileInput.files[0].name;
    }
});

// ===== File Input Change =====
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        dropZoneText.textContent = fileInput.files[0].name;
    } else {
        dropZoneText.textContent = "اسحب وافلت ملف الاكسل هنا\nأو اضغط لاختياره";
    }
});

// ===== Gender Toggle =====
const genderFilter = document.getElementById('gender_filter');
const genderSelect = document.getElementById('gender_select');
const genderField = document.getElementById('gender-field');

genderFilter.addEventListener('change', () => {
    if (genderFilter.value === 'yes') {
        genderSelect.classList.remove('hidden');
        genderSelect.classList.add('show');
        genderField.classList.remove('hidden');
        genderField.classList.add('show');
    } else {
        genderSelect.classList.remove('show');
        genderSelect.classList.add('hidden');
        genderField.classList.remove('show');
        genderField.classList.add('hidden');
    }
});

// ===== Manual Fields Toggle =====
const manualSelect = document.getElementById('manual_select');
const manualFields = document.getElementById('manual-fields');

manualSelect.addEventListener('change', () => {
    if (manualSelect.value === 'yes') {
        manualFields.classList.remove('hidden');
        manualFields.classList.add('show');
    } else {
        manualFields.classList.remove('show');
        manualFields.classList.add('hidden');
    }
});

// ===== Submit with AJAX =====
form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (fileInput.files.length === 0) {
        showToast("الرجاء اختيار ملف أولاً", "error", 5000);
        return;
    }

    const formData = new FormData(form);
    const originalFileName = fileInput.files[0].name;
    const vcfFileName = originalFileName.replace(/\.[^/.]+$/, ".vcf");

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);

    // ===== Upload Progress =====
    xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);

            // لتجنب الإزعاج: يظهر كل 10%
            if (percent % 10 === 0) {
                showToast("جاري الرفع: " + percent + "%");
            }
        }
    });

    // ===== Response =====
    xhr.onload = function () {
        if (xhr.status === 200) {
            const blob = new Blob([xhr.response], { type: "application/octet-stream" });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = vcfFileName;
            link.click();

            showToast("تم التحويل بنجاح!", "success", 5000);
        } else {
            showToast("حدث خطأ أثناء التحويل", "error", 5000);
        }
    };

    xhr.onerror = function () {
        showToast("فشل الاتصال بالسيرفر", "error", 5000);
    };

    xhr.responseType = 'blob';
    xhr.send(formData);
});
