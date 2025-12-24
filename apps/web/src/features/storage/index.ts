/**
 * Storage Feature
 *
 * Provides Open/Save functionality for project files.
 */

export {
	getAcceptPattern,
	isAcceptableFile,
} from "./services/codecs";
export { openFile, saveProjectFile } from "./services/project-storage";
