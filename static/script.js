let files = [];
const dropArea = document.getElementById("drop-area");
const fileElem = document.getElementById("fileElem");
const fileList = document.getElementById("file-list");
const mergeBtn = document.getElementById("mergeBtn");
const progress = document.getElementById("progress");
const bar = document.querySelector(".bar");
const status = document.getElementById("statusText");

// ===== Upload =====
dropArea.addEventListener("click", () => fileElem.click());

fileElem.addEventListener("change", (e) => handleFiles(e.target.files));

dropArea.addEventListener("dragover", (e) => e.preventDefault());

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
});

function handleFiles(selectedFiles) {
    for (let file of selectedFiles) files.push(file);
    renderList();
    status.innerText = `تم اختيار ${files.length} ملف`;
}

// ===== Render List =====
function renderList() {
    fileList.innerHTML = "";

    files.forEach((file, index) => {
        let li = document.createElement("li");
        li.draggable = true;
        li.dataset.index = index;

        li.innerHTML = `
            ${file.name}
            <div>
                <button onclick="moveUp(${index})">⬆️</button>
                <button onclick="moveDown(${index})">⬇️</button>
                <button onclick="removeFile(${index})">❌</button>
            </div>
        `;

        // Drag logic
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

            let draggedIndex = e.dataTransfer.getData("text/plain");

            let dragged = files.splice(draggedIndex, 1)[0];
            files.splice(index, 0, dragged);

            renderList();
        });

        li.addEventListener("dragend", () => li.classList.remove("dragging"));

        fileList.appendChild(li);
    });
}

function moveUp(i) {
    if (i === 0) return;
    [files[i-1], files[i]] = [files[i], files[i-1]];
    renderList();
}

function moveDown(i) {
    if (i === files.length - 1) return;
    [files[i+1], files[i]] = [files[i], files[i+1]];
    renderList();
}

function removeFile(i) {
    files.splice(i, 1);
    renderList();
}

// ===== Merge =====
mergeBtn.addEventListener("click", () => {

    if (files.length === 0) {
        alert("يرجى اختيار ملف");
        return;
    }

    let formData = new FormData();
    files.forEach(f => formData.append("pdfs", f));

    progress.classList.remove("hidden");
    status.innerText = "جاري رفع الملفات...";

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/merge");
    xhr.responseType = "blob";

    xhr.upload.onprogress = (e) => {
        let percent = (e.loaded / e.total) * 100;
        bar.style.width = percent + "%";
        status.classList.remove("success", "error");
        status.innerText = `جاري الرفع ${Math.round(percent)}%`;
    };

    xhr.onload = () => {

        if (xhr.status === 200) {

            status.innerText = "جاري الدمج...";

            let blob = xhr.response;
            let url = URL.createObjectURL(blob);

            let link = document.createElement("a");
            link.href = url;

            let name = document.getElementById("NewName").value.trim() || "merged";
            link.download = name + ".pdf";

            link.click();
            URL.revokeObjectURL(url);

            status.innerText = "✅ تم الدمج بنجاح";
            status.className = "success";
} else {
    status.innerText = "❌ حدث خطأ";
    status.className = "error";}

        progress.classList.add("hidden");
        bar.style.width = "0%";

        // fade out
        setTimeout(() => {
            status.classList.add("fade-out");
            setTimeout(() => {
                status.innerText = "";
                status.classList.remove("fade-out");
            }, 300);
        }, 2000);
    };

    xhr.send(formData);
});

// ===== Delete Pages =====
async function deletePages() {

    const file = document.getElementById("deleteFile").files[0];
    const pages = document.getElementById("pagesInput").value;

    if (!file || !pages) {
        alert("يرجى اختيار ملف وإدخال الصفحات");
        return;
    }

    let formData = new FormData();
    formData.append("pdf", file);
    formData.append("pages", pages);

    let res = await fetch("/delete-pages", { method: "POST", body: formData });

    if (!res.ok) {
        alert("حدث خطأ");
        return;
    }

    let blob = await res.blob();
    let url = URL.createObjectURL(blob);

    let link = document.createElement("a");
    link.href = url;

    let name = file.name.replace(".pdf", "");
    link.download = name + "_جديد.pdf";

    link.click();
    URL.revokeObjectURL(url);
}
