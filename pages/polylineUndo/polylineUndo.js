import Stack from './stack';
import UndoManager from './UndoManager';
import ConcreteCommand from './ConcreteCommand';
import Konva from "konva";
import { createMachine, interpret } from "xstate";

const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const buttonUndo = document.getElementById("undo")

const buttonRedo = document.getElementById("redo")

const undoManager = new UndoManager()

// Une couche pour le dessin
const dessin = new Konva.Layer();
// Une couche pour la polyline en cours de construction
const temporaire = new Konva.Layer();
stage.add(dessin);
stage.add(temporaire);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAIwAWAGxEArAGYAHDo0AmA3x2qNqxRoA0ITEoCciosoDsRg-Zf6DWg4pcAvgE2aFh4hCRklHQAcgAiNPxCSCBoYpLSsgoIALQGyk72HhpFegZuOvY2dghafBpE9srKulqqxnzGpkEhGDgExKTkFABKTAlJsmkSUjIp2XmGREaqyiUlWgUuJtWIRUQ6Loqq7V32nfZaPal94cTSYAAKqATi1PTMbJy8glOiM5l5ogLPYDpYCj5FB5DlVbA4nK4jLoWi57IY+KprqF+hEHs9Xu9GExaAA1JiTFLTDJzUDZVxaRoaSo+LRaew6FHWOEIRR8JwGHRaRSlCzKfKqHRY24DIh4l74N5MWAAYwAhsgwBSROlZlklO1nJUtEcfJ5Lj5drVjAcDBoWhpzKoXEyDFKwjKALaq-CYfEK2CEz4cbham46wG0pR8FwM8ybTqdQ6uS3lHREFwxk6oprbDlXYI3d0RL0+v3iAO0IlfEOKZLagE0+RRiWaY2bNbKQWKQ6WtouZx1DEFRTdszKN044gl33y8uB4k0Mmhqm6oE8qENE7tNyGO1rFyW3n8rsilT5QIF7F3IjTssBpVqjXL-7UvUIHSdTTRzwOw529q9qChwGO0TRsloGhQhevRFlO3ozq894KmAABOz7ho22RFEBGZIkyqjxjolo5Lyzgjs6xrNIKLgnJKl7SsW8F3hQABCqrKgA1rAyDsZqvyUi+q6RggRzqC0xqCicaxOsovbWjotr2o6zoKRO163rOAZsZx3G8TwtZ-Bhb5qMoBzsui3bnBmsI1L4fA2naEHKUyij5gW+CoBAcB-LBhkNm+OSDssIFrGilxbIoxGeJoXhsqY5SuEydEwZOkTkH5r5rgYzhon4aK8s0NFQimKjLPhngFIcxz5il15yq8GVCU2tQuKZbKdvU5wKXwQolaZtqmBV3aiZsamekxmmNRGzXsgyzp8JcNG+ElfVEE6lwjj1cWouOQQBEAA */
        id: "polyLine",
        initial: "idle",
        states: {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "onePoint",
                        actions: "createLine",
                    },

                    UNDO: {
                        target: "idle",
                        actions: "undo",
                        internal: true,
                        cond: "canUndo"
                    },

                    REDO: {
                        target: "idle",
                        actions: "redo",
                        internal: true,
                        cond: "canRedo"
                    }
                },
            },

            onePoint: {
                on: {
                    MOUSECLICK: {
                        target: "manyPoints",
                        actions: "addPoint",
                    },
                    MOUSEMOVE: {
                        actions: "setLastPoint",
                    },
                    Escape: { // event.key
                        target: "idle",
                        actions: "abandon",
                    },
                },
            },

            manyPoints: {
                on: {
                    MOUSECLICK: [
                        {
                            actions: "addPoint",
                            cond: "pasPlein",
                        },
                        {
                            target: "idle",
                            actions: ["addPoint", "saveLine"],
                        },
                    ],

                    MOUSEMOVE: {
                        actions: "setLastPoint",
                    },

                    Escape: {
                        target: "idle",
                        actions: "abandon",
                    },

                    Enter: { // event.key
                        target: "idle",
                        actions: "saveLine",
                    },

                    Backspace: [ // event.key
                        {
                            target: "manyPoints",
                            actions: "removeLastPoint",
                            cond: "plusDeDeuxPoints",
                            internal: true,
                        },
                        {
                            target: "onePoint",
                            actions: "removeLastPoint",
                        },
                    ],
                },
            }
        },
    },
    {
        actions: {
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                temporaire.add(polyline);
            },
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                temporaire.batchDraw();
            },
            saveLine: (context, event) => {
                polyline.remove(); // On l'enlève de la couche temporaire
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                polyline.stroke("black"); // On change la couleur
                // On sauvegarde la polyline dans la couche de dessin
                buttonUndo.disabled = false;
                undoManager.execute(new ConcreteCommand(dessin, polyline))
            },
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                temporaire.batchDraw(); // Redraw the layer to reflect the changes
            },
            abandon: (context, event) => {
                polyline.remove();
            },
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                temporaire.batchDraw(); // Redraw the layer to reflect the changes
            },
            undo: (context, event) => {
                undoManager.undo()
                if(!undoManager.canUndo()){
                    buttonUndo.disabled = true;
                }
                buttonRedo.disabled = false;
            },
            redo: (context, event) => {
                undoManager.redo()
                if(!undoManager.canRedo()){
                    buttonRedo.disabled = true;
                }
                buttonUndo.disabled = false;
            },
        },
        guards: {
            pasPlein: (context, event) => {
                // On peut encore ajouter un point
                return polyline.points().length < MAX_POINTS * 2;
            },
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
            canUndo: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return undoManager.canUndo();
            },
            canRedo: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return undoManager.canRedo();
            },
        },
    }
);

const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();

stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

buttonUndo.addEventListener("click", () => {
    polylineService.send("UNDO");
});

buttonRedo.addEventListener("click", () => {
    polylineService.send("REDO");
});

window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    polylineService.send(event.key);
});
