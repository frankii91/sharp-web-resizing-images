import { promises as fs } from "fs";

class DirectoryManager {
    constructor() {
        if (DirectoryManager.instance) return DirectoryManager.instance;
        this.initializedDirectories = new Set();
        DirectoryManager.instance = this;
    }

    async initDirectory(directoryPath) {
        if (this.initializedDirectories.has(directoryPath)) return true;

        try {
            await fs.mkdir(directoryPath, { recursive: true });
            this.initializedDirectories.add(directoryPath);
            return true;
        } catch (error) {
            console.error("Could not create directory. An error occurred:", error);
            throw new Error("Could not create directory");
        }
    }
}

export default new DirectoryManager();
