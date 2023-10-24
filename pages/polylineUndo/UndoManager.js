import Stack from "./stack";

class UndoManager {
    constructor() {
        this.undoStack = new Stack();
        this.redoStack = new Stack();
    }

    execute(command) {
        command.execute()
        this.undoStack.push(command);
    }

    canUndo() {
        return !this.undoStack.isEmpty()
    }

    canRedo() {
        return !this.redoStack.isEmpty()
    }

    undo() {
        this.undoStack.peek().undo()
        this.redoStack.push(this.undoStack.pop())
    }

    redo() {
        this.redoStack.peek().execute()
        this.undoStack.push(this.redoStack.pop())
    }
}

export default UndoManager;