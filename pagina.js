// mi-claude: el carrete del hero, la historia fija, el repo, el libro de proyectos,
// las pestañas de los días y la frase que arma el comando de instalación.
(() => {
  const menosMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const escritorio = matchMedia("(min-width: 761px)");

  // Con menos movimiento, el clip se queda en su imagen fija.
  if (menosMovimiento) document.querySelectorAll("video[autoplay]").forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });

  // --- El carrete avanza con el scroll mientras las dos mitades de la frase se quedan.
  const hero = document.querySelector(".hero");
  const escena = document.querySelector(".hero-escena");
  const pista = document.querySelector(".carrete-pista");
  const cuadros = pista ? pista.children.length : 0;
  function moverCarrete() {
    if (!hero || !escritorio.matches) { if (pista) pista.style.removeProperty("--paso"); return; }
    const recorrido = hero.offsetHeight - escena.offsetHeight;
    const avance = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / recorrido));
    const paso = avance * (cuadros - 1);
    pista.style.setProperty("--paso", (menosMovimiento ? Math.round(paso) : paso).toFixed(3));
  }
  let pendiente = false;
  addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; moverCarrete(); });
  }, { passive: true });
  addEventListener("resize", moverCarrete);
  moverCarrete();

  // --- Entradas: cada parte de una sección sube y aparece, una detrás de otra.
  const entradas = [...document.querySelectorAll("[data-entra]")];
  if ("IntersectionObserver" in window) {
    const vistas = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const hermanos = [...e.target.closest("section").querySelectorAll("[data-entra]")];
        e.target.style.setProperty("--retraso", `${Math.max(0, hermanos.indexOf(e.target)) * 75}ms`);
        e.target.classList.add("entra");
        vistas.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    entradas.forEach((el) => vistas.observe(el));
  } else {
    entradas.forEach((el) => el.classList.add("entra"));
  }

  // --- Cómo trabajamos: la frase que está al centro manda el estado de la sesión.
  const sesion = document.querySelector(".sesion");
  const pasos = [...document.querySelectorAll(".paso")];
  if (sesion && "IntersectionObserver" in window) {
    const centro = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        pasos.forEach((p) => p.classList.toggle("activo", p === e.target));
        sesion.dataset.estado = e.target.dataset.paso;
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    pasos.forEach((p) => centro.observe(p));
  }

  // --- El repo: cada archivo muestra un pedazo real de su contenido.
  const archivos = [...document.querySelectorAll(".archivo")];
  archivos.forEach((b) => b.addEventListener("click", () => {
    archivos.forEach((x) => x.classList.toggle("activo", x === b));
    document.querySelectorAll(".extracto").forEach((x) => x.classList.toggle("activo", x.dataset.extracto === b.dataset.archivo));
  }));

  // --- Lo que hicimos: al pasar o enfocar una fila, su imagen aparece a la altura de la fila.
  const libro = document.querySelector(".libro");
  const vista = document.querySelector(".vista");
  const filas = [...document.querySelectorAll(".fila")];
  function mostrar(fila) {
    filas.forEach((f) => f.classList.toggle("activa", f === fila));
    const img = vista.querySelector("img");
    vista.style.setProperty("--vista-y", `${fila.offsetTop}px`);
    if (img.getAttribute("src") === fila.dataset.foto) return;
    vista.classList.add("cambiando");
    setTimeout(() => {
      img.src = fila.dataset.foto;
      vista.classList.toggle("contener", fila.hasAttribute("data-contener"));
      vista.classList.remove("cambiando");
    }, 150);
  }
  if (libro && vista) {
    filas.forEach((f) => {
      f.addEventListener("mouseenter", () => { libro.classList.add("hay-foco"); mostrar(f); });
      f.addEventListener("focus", () => { libro.classList.add("hay-foco"); mostrar(f); });
    });
    libro.querySelector(".filas").addEventListener("mouseleave", () => libro.classList.remove("hay-foco"));
    requestAnimationFrame(() => mostrar(filas[0]));
  }

  // --- Los días: una pestaña por día; sin script se ven los tres.
  const pestanas = [...document.querySelectorAll('[role="tab"]')];
  function elegir(tab) {
    pestanas.forEach((t) => {
      const activa = t === tab;
      t.setAttribute("aria-selected", String(activa));
      t.tabIndex = activa ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !activa;
    });
  }
  pestanas.forEach((t, i) => {
    t.addEventListener("click", () => elegir(t));
    t.addEventListener("keydown", (e) => {
      const paso = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!paso) return;
      e.preventDefault();
      const otra = pestanas[(i + paso + pestanas.length) % pestanas.length];
      elegir(otra);
      otra.focus();
    });
  });
  if (pestanas.length) elegir(pestanas.find((t) => t.getAttribute("aria-selected") === "true") || pestanas[0]);

  // --- La frase con el hueco: la carpeta que escribes entra en el comando del sistema elegido,
  // y "Copiar" lo copia. Empieza en Mac si la visita viene de una.
  const frase = document.getElementById("frase");
  const carpeta = document.getElementById("carpeta");
  const comando = document.getElementById("comando");
  const boton = document.querySelector(".frase-boton");
  const sistemas = [...document.querySelectorAll("[data-sistema]")];
  const plataforma = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
  let sistema = /mac/i.test(plataforma) ? "mac" : "windows";
  function armar() {
    const ruta = carpeta.value.trim().replace(/"/g, "");
    // En la Mac, "~" entre comillas no se expande: se cambia por $HOME, que sí.
    comando.textContent = sistema === "mac"
      ? "cd ~ && git clone https://github.com/renatopuente/mi-claude.git\n" +
        "bash ~/mi-claude/instalar.sh" + (ruta ? ` --carpeta "${ruta.replace(/^~(?=\/|$)/, "$HOME")}"` : "")
      : "git clone https://github.com/renatopuente/mi-claude.git\n" +
        "powershell -ExecutionPolicy Bypass -File .\\mi-claude\\instalar.ps1" + (ruta ? ` -Carpeta "${ruta}"` : "");
  }
  function elegirSistema(s) {
    sistema = s;
    sistemas.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sistema === s)));
    document.querySelectorAll("[data-nota]").forEach((n) => { n.hidden = n.dataset.nota !== s; });
    armar();
  }
  if (frase) {
    sistemas.forEach((b) => b.addEventListener("click", () => elegirSistema(b.dataset.sistema)));
    elegirSistema(sistema);
    carpeta.addEventListener("input", armar);
    frase.addEventListener("submit", async (e) => {
      e.preventDefault();
      armar();
      try {
        await navigator.clipboard.writeText(comando.textContent);
        boton.textContent = "Copiado";
      } catch {
        const rango = document.createRange();
        rango.selectNodeContents(comando);
        getSelection().removeAllRanges();
        getSelection().addRange(rango);
        boton.textContent = "Selecciónalo";
      }
      setTimeout(() => { boton.textContent = "Copiar"; }, 2200);
    });
  }
})();
