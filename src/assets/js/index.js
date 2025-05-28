const { ipcRenderer } = require("electron");
import { config, database } from "./utils.js";
const os = require("os");

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
            { message: "Idée de nouveau mods ?\n", author: "Launcher" },
            {
                message: "Bienvenue sur mon Launcher !",
                author: "AlessGoldmen",
            },
        ];

        let splash = splashes[Math.floor(Math.random() * splashes.length)];
        this.splashMessage.textContent = splash.message;
        this.splashAuthor.children[0].textContent = "@" + splash.author;
        await sleep(100);
        document.querySelector("#splash").style.display = "flex";
        await sleep(500);
        this.splash.classList.add("opacity");
        await sleep(500);
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

        ipcRenderer.on("updateAvailable", () => {
            this.setStatus("Mise à jour disponible !");
            if (os.platform() === "win32") {
                this.togglePropgress();
                ipcRenderer.send("start-update");
            } else {
                return this.downloadUpdate();
            }
        });

        ipcRenderer.on("error", (_e, progress) => {
            ipcRenderer.send("update-window-progress", {
                progress: progress.transferred,
                size: progress.total,
            });
            this.setProgress(progress.transferred, progress.total);
        });

        ipcRenderer.on("update-not-available", () => {
            console.error("Mise à jour non disponible");
            this.maintenanceCheck();
        });
    }

    async downloadUpdate() {
        //
    }

    maintenanceCheck() {
        config.GetConfig().then((res) => {
            if (res.isClosed) return this.shutdown(res.closed_message);
            console.log("Launch");
            this.startLauncher();
        }).catch(e => {
            console.error(e);
            return this.shutdown("Aucune connexion internet détectée,<br>veuillez réessayer ultétieurement.<br><br>Si le problème perciste veuillez contacter <a href=\"https://github.com/Mewax07\">Mewax07<a>")
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

    setProgress(value = 0, max = 1) {
        value = Number(value);
        max = Number(max);
    
        if (!isFinite(value) || !isFinite(max) || max <= 0) {
            console.warn("Progress non valide :", { value, max });
            return;
        }
    
        this.progress.value = value;
        this.progress.max = max;
    }    
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey && e.shiftKey && e.keyCode == 73) || e.keyCode == 123) {
        ipcRenderer.send("update-window-dev-tools");
    }
});

new Splash();
