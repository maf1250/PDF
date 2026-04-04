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
function showToast(msg, type="success", duration=5000) {
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

        // Drag & Drop Sorting
        li.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index);
            li.classList.add("dragging");
        });
        li.addEventListener("dragover", (e) => {
            e.preventDefault();
            li.classList.add("dragover");
        });
        li.addEventListener("dragleave", () => li.classList.remove("dragover"));
        li.addEventListener("drop", (e) => {
            e.preventDefault();
            li.classList.remove("dragover");
            const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
            const targetIndex = parseInt(li.dataset.index);
            if (draggedIndex !== targetIndex) {
                const draggedFile = files[draggedIndex];
                files.splice(draggedIndex, 1);
                files.splice(targetIndex, 0, draggedFile);
                renderList();
            }
        });
        li.addEventListener("dragend", () => li.classList.remove("dragging"));

        fileList.appendChild(li);
    });
}

// ===== Merge PDFs =====
mergeBtn.addEventListener("click", () => {
    if (!files.length) { showToast("يرجى اختيار ملف", "error"); return; }
    mergeBtn.disabled = true;

    let formData = new FormData();
    files.forEach(file => formData.append("pdfs", file));
    progress.classList.remove("hidden");

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/merge");
    xhr.responseType = "blob";

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            let percent = (e.loaded / e.total) * 100;
            bar.style.width = percent + "%";
            showToast(`جاري الرفع ${Math.round(percent)}%`, "success", 5000);
        }
    };

    xhr.onload = () => {
        mergeBtn.disabled = false;
        progress.classList.add("hidden");
        bar.style.width = "0%";

        if (xhr.status === 200) {
            let blob = xhr.response;
            let filename = document.getElementById("NewName").value.trim() || "merged";
            saveAs(blob, filename + ".pdf");  //  FileSaver handles all platforms
            showToast("✅ تم الدمج بنجاح", "success");
        } else {
            showToast("❌ حدث خطأ أثناء الدمج", "error", 5000);
        }
    };

    xhr.onerror = () => {
        mergeBtn.disabled = false;
        progress.classList.add("hidden");
        bar.style.width = "0%";
        showToast("❌ حدث خطأ أثناء الاتصال بالخادم", "error", 5000);
    };

    xhr.send(formData);
});

// ===== Delete Pages =====
async function deletePages(event) {
    const file = document.getElementById("deleteFile").files[0];
    const pages = document.getElementById("pagesInput").value;
    const btn = event.target;
    const progressBarContainer = document.getElementById("deleteProgress");
    const progressBar = document.querySelector(".deleteBar");

    if (!file || !pages) { 
        showToast("يرجى اختيار ملف وإدخال الصفحات", "error"); 
        return; 
    }

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

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                let percent = (e.loaded / e.total) * 100;
                progressBar.style.width = percent + "%";
            }
        };

        xhr.onload = () => {
            btn.disabled = false;
            progressBarContainer.classList.add("hidden");
            progressBar.style.width = "0%";

            if (xhr.status === 200) {
                let blob = xhr.response;
                let nameWithoutExt = file.name.replace(/\.pdf$/i, "");
                saveAs(blob, nameWithoutExt + "_جديد.pdf"); // FileSaver works everywhere
                showToast("✅ تم حذف الصفحات بنجاح", "success", 5000);
            } else {
                showToast("❌ حدث خطأ أثناء حذف الصفحات", "error", 5000);
            }
        };

        xhr.onerror = () => {
            btn.disabled = false;
            progressBarContainer.classList.add("hidden");
            progressBar.style.width = "0%";
            showToast("❌ حدث خطأ أثناء الاتصال بالخادم", "error", 5000);
        };
        
        xhr.send(formData);

    } catch (err) {
        btn.disabled = false;
        progressBarContainer.classList.add("hidden");
        progressBar.style.width = "0%";
        showToast(err.message, "error", 5000);
    }
}
