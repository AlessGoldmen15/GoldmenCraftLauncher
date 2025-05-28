const { ipcRenderer} = require("electron")
import { database } from "./utils.js";

class Splash {
    constructor() {
        this.splash = document.querySelector(".splash");
        this.splashMessage = document.querySelector(".splash-message");
        this.splashAuthor = document.querySelector(".splash-author");
        this.message = document.querySelector(".message");
        this.progress = document.querySelector(".progress");
        document.addEventListener("DOMContentLoaded", async () => {
            let databaseLauncher = new database();
            let configClient = await databaseLauncher.readData("configClient");
            let theme = configClient?.launcher_config?.theme || "auto";
            let isDarkTheme = await ipcRenderer
                .invoke("is-dark-theme", theme)
                .then((res) => res);
            document.body.className = isDarkTheme
                ? "dark global"
                : "light global";
            if (process.platform === "win32")
                ipcRenderer.send("update-window-progress-load");
            this.startAnimation();
        });
    }

    async startAnimation() {
        let splashes = [
            { message: "Nouveau mods ?", author: "Launcher" },
            {
                message:
                    "Une aventure vous attend! Mais ... une petite mise à jour",
                author: "Mewax07",
            },
            {
                message: "Bienvenue sur mon Launcher !",
                author: "AlessGoldmen",
            },
        ];

        let splash = splashes[Math.floor(Math.random() * splashes.length)];
        this.splashMessage.textContent = splash.message;
        this.splashAuthor.children[0].textContent = "@" + splash.author;
        await sleep(100);
        document.querySelector("#splash").style.display = "block";
        await sleep(500);
        this.splash.classList.add("opacity");
        await sleep(500);
        this.splash.classList.add("translate");
        this.splashMessage.classList.add("opacity");
        this.splashAuthor.classList.add("opacity");
        this.message.classList.add("opacity");
        await sleep(1000);
        this.checkUpdate();
    }

    async checkUpdate() {
        this.setStatus("Recherche de mise à jour...");

        ipcRenderer
            .invoke("update-app")
            .then()
            .catch((err) => {
                return this.shutdown(
                    `erreur lors de la recherche de mise à jour : <br>${err.message}`,
                );
            });
    }

    startLauncher() {
        this.setStatus("Démarrage du launcher");
        ipcRenderer.send("main-window-open");
        ipcRenderer.send("update-window-close");
    }

    shutdown(text) {
        this.setStatus(`${text}<br>Arrêt dans 5s`);
        let i = 4;
        setInterval(() => {
            this.setStatus(`${text}<br>Arrêt dans ${i--}s`);
            // if (i < 0) ipcRenderer.send("update-window-close");
        }, 1000);
    }

    setStatus(text) {
        this.message.innerHTML = text;
    }

    togglePropgress() {
        if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
    }

    setProgress(value, max) {
        this.progress.value = value;
        this.progress.max = max;
    }
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
    console.log(e);
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
        ipcRenderer.send("update-window-dev-tools");
    }
})

new Splash();
