const slides = Array.from(document.querySelectorAll(".slide"));
const list = document.getElementById("slideList");
const counter = document.getElementById("counter");
let current = 0;

slides.forEach((slide, index) => {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = `${String(index + 1).padStart(2, "0")} ${slide.dataset.title}`;
  button.addEventListener("click", () => showSlide(index));
  li.appendChild(button);
  list.appendChild(li);
});

function showSlide(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === current);
  });
  Array.from(list.querySelectorAll("button")).forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === current);
  });
  counter.textContent = `${current + 1} / ${slides.length}`;
}

document.getElementById("prevBtn").addEventListener("click", () => showSlide(current - 1));
document.getElementById("nextBtn").addEventListener("click", () => showSlide(current + 1));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") showSlide(current + 1);
  if (event.key === "ArrowLeft") showSlide(current - 1);
  if (event.key.toLowerCase() === "f") document.documentElement.requestFullscreen?.();
});

showSlide(0);
