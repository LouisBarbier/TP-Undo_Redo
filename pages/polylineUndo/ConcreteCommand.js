class ConcreteCommand {
    constructor(dessin, line) {
        this._dessin = dessin
        this._line = line
    }

    execute() {
        _dessin.add(line);
    }

    undo() {
        _line.remove();
    }
}

export default Stack;