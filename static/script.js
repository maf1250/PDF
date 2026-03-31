// ===== JS =====
let files = [];
const dropArea = document.getElementById("drop-area");
const fileElem = document.getElementById("fileElem");
const fileList = document.getElementById("file-list");
const mergeBtn = document.getElementById("mergeBtn");
const progress = document.getElementById("progress");
const bar = document.querySelector(".bar");
const toast = document.getElementById("toast");

// ===== Toast helper =====
function showToast(msg, type="success", duration=4000) {
    toast.innerText = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = "toast"; }, duration);
}

// ===== Drag & Drop =====
dropArea.addEventListener("click", () => fileElem.click());
fileElem.addEventListener("change", e => handleFiles(e.target.files));
dropArea.addEventListener("dragover", e => e.preventDefault());
dropArea.addEventListener("drop", e => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
});

function handleFiles(selectedFiles) {
    for (let file of selectedFiles) files.push(file);
    renderList();
}

// ===== Render File List =====
function renderList() {
    fileList.innerHTML = "";
    files.forEach((file, index) => {
        let li = document.createElement("li");
        li.draggable = true;
        li.dataset.index = index;
        li.innerHTML = `
            ${file.name} 
            <div style="display:inline-flex; gap:5px">
                <button class="up-btn">⬆️</button>
                <button class="down-btn">⬇️</button>
                <button class="remove-btn">❌</button>
            </div>
        `;
        // Arrow buttons
        li.querySelector(".up-btn").addEventListener("click", () => {
            if (index === 0) return;
            [files[index-1], files[index]] = [files[index], files[index-1]];
            renderList();
        });
        li.querySelector(".down-btn").addEventListener("click", () => {
            if (index === files.length-1) return;
            [files[index+1], files[index]] = [files[index], files[index+1]];
            renderList();
        });
        li.querySelector(".remove-btn").addEventListener("click", () => {
            files.splice(index, 1);
            renderList();
        });
        fileList.appendChild(li);
    });
}

// ===== Merge PDFs =====
    mergeBtn.addEventListener("click", () => {
    if (!files.length) { showToast("يرجى اختيار ملف", "error"); return; }
  //  Disable the  button
    mergeBtn.disabled = true;
    let formData = new FormData();
    files.forEach(file => formData.append("pdfs", file));
    progress.classList.remove("hidden");
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/merge");
    xhr.responseType = "blob";
    xhr.upload.onprogress = (e) => {
        let percent = (e.loaded / e.total) * 100;
        bar.style.width = percent + "%";
        showToast(`جاري الرفع ${Math.round(percent)}%`, "success", 5000);
    };
    xhr.onload = () => {
    //  Re-enable the button
        mergeBtn.disabled = false;
        if (xhr.status === 200) {
            let blob = xhr.response;
            let url = window.URL.createObjectURL(blob);
            let link = document.createElement("a");
            link.href = url;
            let filename = document.getElementById("NewName").value.trim() || "merged";
            link.download = filename + ".pdf";
            link.click();
            window.URL.revokeObjectURL(url);
            showToast("✅ تم الدمج بنجاح", "success");
        } else {
            showToast("❌ حدث خطأ أثناء الدمج", "error", 5000);
        }
        progress.classList.add("hidden");
        bar.style.width = "0%";
    };
   xhr.onerror = () => {
        mergeBtn.disabled = false; // ✅ Re-enable on error
        showToast("❌ حدث خطأ أثناء الاتصال بالخادم", "error", 5000);
        progress.classList.add("hidden");
        bar.style.width = "0%";
    };
    xhr.send(formData);
});

// ===== Delete Pages =====
async function deletePages() {
    const file = document.getElementById("deleteFile").files[0];
    const pages = document.getElementById("pagesInput").value;
    const btn = event.target; // the button that triggered the function
    const progressBarContainer = document.getElementById("deleteProgress");
    const progressBar = document.querySelector(".deleteBar");

    if (!file || !pages) { 
        showToast("يرجى اختيار ملف وإدخال الصفحات", "error", 3500); 
        return; 
    }
    // Disable button and show progress
    btn.disabled = true;
    progressBarContainer.classList.remove("hidden");
    progressBar.style.width = "0%";
    let formData = new FormData();
    formData.append("pdf", file);
    formData.append("pages", pages);
    try {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/delete-pages");
        xhr.responseType = "blob";
        // Track upload progress
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                let percent = (e.loaded / e.total) * 100;
                progressBar.style.width = percent + "%";
            }
        };
        xhr.onload = () => {
            progressBarContainer.classList.add("hidden");
            progressBar.style.width = "0%";
            btn.disabled = false;
            if (xhr.status === 200) {
                let blob = xhr.response;
                let url = window.URL.createObjectURL(blob);
                let link = document.createElement("a");
                link.href = url;
                let nameWithoutExt = file.name.replace(/\.pdf$/i, "");
                link.download = nameWithoutExt + "_جديد.pdf";
                link.click();
                window.URL.revokeObjectURL(url);
                showToast("✅ تم حذف الصفحات بنجاح", "success", 5000);
            } else {
                showToast("❌ حدث خطأ أثناء حذف الصفحات", "error", 5000);
            }
        };
        xhr.onerror = () => {
            progressBarContainer.classList.add("hidden");
            progressBar.style.width = "0%";
            btn.disabled = false;
            showToast("❌ حدث خطأ أثناء الاتصال بالخادم", "error", 5000);
        };

        xhr.send(formData);

    } catch (err) {
        progressBarContainer.classList.add("hidden");
        progressBar.style.width = "0%";
        btn.disabled = false;
        showToast(err.message, "error", 5000);
    }
}
