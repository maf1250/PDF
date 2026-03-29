from flask import Flask, request, send_file, render_template
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
import os, uuid

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ===== Home page =====
@app.route('/')
def index():
    return render_template('index.html')

# ===== Merge PDFs =====
@app.route('/merge', methods=['POST'])
def merge():
    files = request.files.getlist('pdfs')
    merger = PdfMerger()
    temp_files = []

    output_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.pdf")

    for file in files:
        path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_{file.filename}")
        file.save(path)
        temp_files.append(path)
        merger.append(path)

    merger.write(output_path)
    merger.close()

    # Cleanup temp files
    for f in temp_files:
        try:
            os.remove(f)
        except:
            pass

    return send_file(output_path, as_attachment=True)

# ===== Delete pages from a PDF =====
@app.route('/delete-pages', methods=['POST'])
def delete_pages():
    file = request.files['pdf']
    pages_to_delete = request.form.get('pages')  # e.g. "2,5,7-10"

    reader = PdfReader(file)
    writer = PdfWriter()
    total_pages = len(reader.pages)

    delete_set = set()
    for part in pages_to_delete.split(','):
        if '-' in part:
            start, end = map(int, part.split('-'))
            for i in range(start, end + 1):
                delete_set.add(i - 1)
        else:
            delete_set.add(int(part) - 1)

    for i in range(total_pages):
        if i not in delete_set:
            writer.add_page(reader.pages[i])

    output_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.pdf")
    with open(output_path, "wb") as f:
        writer.write(f)

    return send_file(output_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)