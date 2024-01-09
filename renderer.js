let selectedNote;
let checklist = [];

window.api.receive("send-all-notes", (data) => {
  selectNote(data.selectedFile);
  window.api.send("get-note", data.selectedFile);
  const nav = document.querySelector("#all-notes");
  const template = document.querySelector("#note-link");
  for (const note of data.files) {
    const clone = template.content.cloneNode(true);
    const button = clone.querySelector("button");
    button.innerHTML = note.replace(/\-|\_/g, " ");
    button.addEventListener("click", () => {
      window.api.send("get-note", note);
      selectNote(note);
    });

    nav.append(button);
  }
});

window.api.receive("send-note", (data) => {
  checklist = data;
  renderList();
});

function renderList() {
  const noteContent = document.querySelector("#note-content");
  noteContent.innerHTML = "";
  const template = document.querySelector("#checkbox-template");
  checklist.sort((a, b) => a.idx - b.idx);
  for (const { isChecked, idx, content } of checklist) {
    const clone = template.content.cloneNode(true);
    const li = clone.querySelector("li");
    const input = li.querySelector("input");
    const id = self.crypto.randomUUID();
    input.id = id;
    input.name = id;
    input.checked = isChecked;
    const label = li.querySelector("label");
    label.setAttribute("for", id);
    label.innerHTML = content;
    noteContent.append(li);
    input.addEventListener("change", (e) => {
      if (e.target.checked) {
        checklist[idx].isChecked = true;
      } else {
        checklist[idx].isChecked = false;
      }
      updateList();
    });
  }
}

function updateList() {
  window.api.send("update-list", { filename: selectedNote, items: checklist });
}

window.api.send("read-all-notes");

document.querySelector("#new-task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target.closest("form");
  const formData = new FormData(form);
  const item = formData.get("new-item");
  checklist.push({ content: item, isChecked: false, idx: checklist.length });
  renderList();
  updateList();
  form.reset();
});

function selectNote(note) {
  selectedNote = note;
  document.querySelector("#main-header").innerHTML = note.replace(
    /\-|\_/g,
    " "
  );
}
