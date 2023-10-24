class ConcreteCommand {
    constructor(dessin, line) {
        this._dessin = dessin
        this._line = line
    }

    execute() {
        this._dessin.add(this._line);
    }

    undo() {
        this._line.remove();
    }
}

export default ConcreteCommand;