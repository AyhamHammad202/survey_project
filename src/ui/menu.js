import { playCursorMove, playMenuClick } from "../audio.js";
import { getState, setAnswer, getAnswer, setState } from "../state.js";

function getOptionLabel(option) {
  if (typeof option === "string") return option;
  if (option && typeof option === "object") {
    return option.label ?? option.value ?? "";
  }
  return String(option ?? "");
}

function getOptionValue(option) {
  if (typeof option === "string") return option;
  if (option && typeof option === "object") {
    return option.value ?? option.label ?? "";
  }
  return String(option ?? "");
}

export function renderMenuOptions(question, bodyEl, onChange) {
  bodyEl.innerHTML = "";
  const { menuFocus } = getState();
  const answer = getAnswer(question.id);

  if (question.type === "scene") {
    if (question.actionLabel) {
      const hint = document.createElement("div");
      hint.className = "scene-hint";
      hint.textContent = question.actionLabel;
      hint.dir = "ltr";
      bodyEl.appendChild(hint);
    }
    return { type: "scene" };
  }

  if (question.type === "text") {
    const textarea = document.createElement("textarea");
    textarea.className = "pixel-textarea";
    textarea.dir = "rtl";
    textarea.maxLength = question.maxLength || 300;
    textarea.placeholder = question.placeholder || "";
    textarea.value = answer || "";
    textarea.setAttribute("aria-label", question.text);

    const count = document.createElement("div");
    count.className = "char-count";
    const updateCount = () => {
      count.textContent = `${textarea.value.length}/${textarea.maxLength || 300}`;
    };
    updateCount();

    textarea.addEventListener("input", () => {
      setAnswer(question.id, textarea.value);
      updateCount();
      onChange?.();
    });

    bodyEl.appendChild(textarea);
    bodyEl.appendChild(count);
    return { type: "text", textarea };
  }

  const list = document.createElement("ul");
  list.className = "menu-options";
  list.setAttribute("role", question.type === "multi" ? "group" : "radiogroup");

  question.options.forEach((opt, idx) => {
    const li = document.createElement("li");
    li.className = "menu-option";
    li.dataset.index = String(idx);
    li.setAttribute("role", question.type === "multi" ? "checkbox" : "radio");
    li.tabIndex = -1;

    const value = getOptionValue(opt);
    const isFocused = idx === menuFocus;
    const isSelected =
      question.type === "multi"
        ? Array.isArray(answer) && answer.includes(value)
        : answer === value;

    if (isFocused) li.classList.add("menu-option--focused");
    if (isSelected) li.classList.add("menu-option--selected");

    const cursor = document.createElement("span");
    cursor.className = "menu-option__cursor";
    cursor.textContent = "▶";

    const check = document.createElement("span");
    check.className = "menu-option__check";
    check.textContent =
      question.type === "multi" ? (isSelected ? "[x]" : "[ ]") : "";

    const label = document.createElement("span");
    label.className = "menu-option__label";
    label.textContent = getOptionLabel(opt);

    li.appendChild(question.type === "multi" ? check : cursor);
    if (question.type === "multi") li.appendChild(cursor);
    li.appendChild(label);

    li.addEventListener("click", () => {
      setState({ menuFocus: idx });
      selectOption(question, opt, onChange);
      playMenuClick();
      refreshMenu(list, question);
    });

    list.appendChild(li);
  });

  bodyEl.appendChild(list);
  return { type: "menu", list };
}

function selectOption(question, opt, onChange) {
  const value = getOptionValue(opt);
  if (question.type === "multi") {
    const current = getAnswer(question.id) || [];
    if (current.includes(value)) {
      setAnswer(
        question.id,
        current.filter((o) => o !== value),
      );
      onChange?.();
      return;
    }
    const limit = question.maxSelect || 0;
    if (limit && current.length >= limit) return;
    setAnswer(question.id, [...current, value]);
  } else {
    setAnswer(question.id, value);
  }
  onChange?.();
}

function refreshMenu(list, question) {
  const { menuFocus } = getState();
  const answer = getAnswer(question.id);
  list.querySelectorAll(".menu-option").forEach((li, idx) => {
    const opt = question.options[idx];
    const value = getOptionValue(opt);
    const isFocused = idx === menuFocus;
    const isSelected =
      question.type === "multi"
        ? Array.isArray(answer) && answer.includes(value)
        : answer === value;

    li.classList.toggle("menu-option--focused", isFocused);
    li.classList.toggle("menu-option--selected", isSelected);

    const check = li.querySelector(".menu-option__check");
    if (check && question.type === "multi") {
      check.textContent = isSelected ? "[x]" : "[ ]";
    }
  });
}

export function moveMenuFocus(question, direction) {
  const max = question.options?.length || 0;
  if (max === 0) return;
  const next = Math.max(0, Math.min(max - 1, getState().menuFocus + direction));
  if (next !== getState().menuFocus) {
    playCursorMove();
    setState({ menuFocus: next });
  }
}

export function confirmMenuFocus(question, onChange) {
  if (!question.options) return;
  const opt = question.options[getState().menuFocus];
  selectOption(question, opt, onChange);
}

export function bindMenuKeyboard(question, handlers) {
  const handler = (e) => {
    if (question.type === "text") return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveMenuFocus(question, 1);
      handlers.onFocusChange?.();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveMenuFocus(question, -1);
      handlers.onFocusChange?.();
    } else if (e.key === "Enter") {
      e.preventDefault();
      confirmMenuFocus(question, handlers.onChange);
      handlers.onFocusChange?.();
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}
