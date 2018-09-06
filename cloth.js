window.addEventListener('load', () => {
    gui = new dat.GUI();
    var enviroment = gui.addFolder('enviroment');
    enviroment.add(this, 'gravity');
    enviroment.add(this, 'windX');
    enviroment.add(this, 'windZ');
    enviroment.add(this, 'drag', 0.9, 1.01);
})
var gravity = 9.81; 
var windX = 0.001;
var windZ = 0.001;
var drag = 0.98; 

var clothIstances = 0;
var maxMaxIteration = 200




/**
 * Simuliert das Verhalten von Textil über ein Partikelnetz.
 * Damit eine Änderungen über einen Zeitschritt geschieht, muss updateMesh() aufgerufen werden
 * Mit einem Masse-Feder-System werden die Positionen der Partikel über Federn zusammengehalten
 * Dies geschieht iterativ, Abbruchbedingung sind @param maxStiffness und eine maximale Anzahl @param maxIterations
 * @param {Number} maxStiffness Prozentangabe [0;1] um wie viel sich die Federn maximal ausdehnen dürfen
 * @param {Number} maxIterations Anzal der (maximalen) Iterationen über die Distanzbedingungen, Auswirkung abhängig vom iterationMode
 */
class Cloth{
    constructor(maxStiffness = 0.1, maxIterations = 10, iterationMode = "fullIteration") {
        this.mesh = null;
        this.mass = 1; 
        this.maxIterations = maxIterations;
        this.maxStiffness = maxStiffness;
        this.iterationMode = iterationMode; 
        this.springStrengths = {
            'structural' : 1,
            'shear' : 1,
            'bend' : 1
        }
        this.elongationMap = false;
    }
    
    /**
     * "Zweiter Konstruktor" 
     * Ersetzt die Punkte mit Partikel, initiert Federn
     * Initierung der Drieecke hier weil Referenzen von Punkten/Partikeln gespeichert werden und diese ja grad überschrieben wurden
     * @param {MeshObject} mesh 
     */
    applyMesh(mesh, pinArr){
        if(mesh instanceof Towel){
            this.mesh = mesh;
            this._setupSpringMass()
            //this._shuffleSprings()
            if(pinArr) this.pin(pinArr)
        }
        else throw Error("MeshObject not suitable for cloth simulation");
    }

    /**
     * Außerhalb von applyMesh, die damit Änderungen an den Punkten nach der Initiation auch ins Backup fließen
     */
    init(){
        this._pointsBakup = JSON.parse(JSON.stringify(this.mesh.points))
        this._setupGui();
    }

    /**
     * Array mit Indices der Partikel, die von Kräften unbeachtetn sein sollen
     * @param {Array} pointIndices 
     */
    pin(pointIndices){
        for(let indice of pointIndices) this.mesh.points[indice].pin();
    }
    
    _setupSpringMass(){
        let amountY=this.mesh.amountY, amountX=this.mesh.amountX

        let points = this.mesh.points;
        for (let i=0; i < points.length; i++) {
            points[i] = new Particle(points[i], this.mass)
        }
        let triangles = this.mesh.triangles = [];
        for (let y=0; y < amountY; y++) {
            for (let x = 0; x < amountX; x++) {
                if (y + 1 == amountY) break;
                if (x + 1 == amountX) continue;
                triangles.push(new Triangle(points[y*amountX + x], points[(y+1)*amountX + x], points[y*amountX + x+1]));
                triangles.push(new Triangle(points[(y+1)*amountX + x], points[(y+1)*amountX + x+1], points[y*amountX + x+1]));
            }
        }
        let springs = this.springs = [];
        for (let y=0; y < amountY; y++) {
            for (let x=0; x < amountX; x++) {
                /* strucutral springs */
                if (x+1 < amountX) {
                    let p0 = points[y*amountX + x],
                        p1 = points[y*amountX + x+1];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'structural'));
                }
                if (y+1 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+1)*amountX + x];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'structural'));
                }
                /* shear springs */
                if (x+1 < amountX && y+1 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+1)*amountX + x+1],
                        p2 = points[y*amountX + x+1],
                        p3 = points[(y+1)*amountX + x];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'shear'));
                    springs.push(new Spring(p2, p3, Vec3.dist(p2, p3), 'shear'));
                }
                /* bend springs */
                if(x+2 < amountX) {
                    let p0 = points[y*amountX + x],
                        p1 = points[y*amountX + x+2];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'bend'));
                }
                if(y+2 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+2)*amountX + x];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'bend'));
                }
            }
        }
    }

    /**
     * Fisher–Yates Shuffle
     * Damit die Abhängigkeit von der Reihenfolge der Federn unterdrückt wird
     * Bilden sich jedoch Artefakte die mit zunehmender (z.b.) gravity schlimmer werden
     */
    _shuffleSprings(){
        let m = this.springs.length, t, i;
        // While there remain elements to shuffle…
        while (m) {
            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);
    
            // And swap it with the current element.
            t = this.springs[m];
            this.springs[m] = this.springs[i];
            this.springs[i] = t;
        }
    }
    
    _setupGui(){
        this._clothIstance = clothIstances++;
        let name = "cloth_" + this._clothIstance;
        let guiFolder = window.gui.addFolder(name);
        let springFolder = guiFolder.addFolder('spring strengths');
        springFolder.add(this.springStrengths, 'structural', 0, 1).step(0.01);
        springFolder.add(this.springStrengths, 'shear', 0, 1).step(0.01);
        springFolder.add(this.springStrengths, 'bend', 0, 1).step(0.01);
        guiFolder.add(this, 'maxIterations', 0, maxMaxIteration).step(1);
        guiFolder.add(this, 'maxStiffness', 0, 1);
        guiFolder.add(this, 'iterationMode', ["singleStiffness", "collectiveStiffness", "fullIteration"]);
        guiFolder.add(this.mesh, 'drawMode', {filled: gl.TRIANGLES, grid: gl.LINES, partikel: gl.POINTS});
        guiFolder.add(this.mesh, 'programName', ["light", "basic"]);
        guiFolder.add(this, 'elongationMap');
        guiFolder.add({resetPosition: () => {
            let points = this.mesh.points;
            let pointsBak = this._pointsBakup
            for(let i=0; i<points.length; i++){
                points[i].set(pointsBak[i]);
                points[i].old.set(pointsBak[i]);

            }
        }}, 'resetPosition');
        guiFolder.open()

        let stats = new Stats();
        this.iterationPanel = stats.addPanel(new Stats.Panel( 'Iterations (' + name + ')   ', '#ff8', '#221' ) );
        stats.showPanel(2)
        stats.domElement.style.cssText = 'position:absolute;top:'+ (2+this._clothIstance) * 48 +'px;';
        document.body.appendChild(stats.dom);
    }



    /** 
     * Simulation loop, muss vom Mesh aufgerufen werden
     * Berechnen der neuen Positionen 
     * Mit anschließendem Update der Bufferdata
     */
    updateMesh(){
        this._applyExternalForces();
        this._applyInternalForcesAndCollision();
        this.mesh.recalculateTriangleNormals();
        this.mesh.updateNormalsFromTriangles();
        this.mesh.updateVerticesFromPoints();
        if(this.elongationMap) this.mesh._colors = this._getColorsFromElongation();
        else this.mesh._colors = this.mesh._colorsBackup;
    }
    
    _applyExternalForces() {
        for (let i=0; i < this.mesh.points.length; i++) {
            let p = this.mesh.points[i];
            if(p.pinned == true) continue;
            let v = Vec3.sub(p, p.old).scale(drag);
            let a = new Vec3(windX, -gravity, windZ).scale(1/60/60);
            p.old.set(p);
            p.add(v.add(a));
        }
    }
    _applyInternalForcesAndCollision() {
        let satisfied = false;
        let i = 0;
        let strength;
        this.__collisionConstraint(); 
   
        for(; satisfied!=true && i<this.maxIterations; i++){
            satisfied = true;
            for (let s of this.springs) {
                strength = this.springStrengths[s.type];
                if(this.iterationMode == 'fullIteration'){
                    satisfied = false;
                    s.disctanceConstraint(strength);
                }
                else if(this.iterationMode == 'collectiveStiffness'){
                    if(Math.abs(s.getElongation(strength)) > this.maxStiffness) {
                        satisfied = false;
                    }
                    s.disctanceConstraint(strength);
                }   
                else if(this.iterationMode == 'singleStiffness'){
                    if(Math.abs(s.getElongation(strength)) > this.maxStiffness) {
                        satisfied = false; 
                        s.disctanceConstraint(strength);
                        //console.log("Overeloganted spring by "+ Math.round((elogation-this.maxStiffness)*100) + "%")
                    }
                }
            }
            this.__collisionConstraint();    
        }
        this.iterationPanel.update(i, maxMaxIteration);
    }   
    __collisionConstraint() {
        // Bottom Collision    
        let bounce = 0.3;  
        let friction = .3;  
        for (let p of this.mesh.points) {
            if (p.y < 0) {
                p.y = 0;
                p.old.x = p.x - (p.x-p.old.x) * friction;
                p.old.y = -p.old.y * bounce;
                p.old.z = p.z - (p.z-p.old.z) * friction;
            }
        }
        

        // Object Collision
        for(let o of objects) {
            if (o instanceof Sphere) o.resolvePointCollision(this.mesh.points);
            else o.resolvePartikelCollision(this.mesh.points);  
        }  
    } 

    /**
     * TODO schleifen effizienter schreiben
     */
    _getColorsFromElongation(){
        let colors = [];
        for(let p of this.mesh.points){
            let elongationCount = 0;
            let strengthCount = 0;
            for(let s of this.springs){
                if(!(s.p0 == p || s.p1 == p)) continue;
                let strength = this.springStrengths[s.type];
                let elongation = s.getElongation(strength);
                elongationCount += elongation;
                strengthCount += strength;
            }
  
            const val = elongationCount/strengthCount;
            const stiff = this.maxStiffness;

            let rgb = new Vec3(
                val/stiff, // wird 0 wenn val negativ ist
                stiff,
                val/-stiff
            ).normalize();
            colors.push(rgb.x, rgb.y, rgb.z, 1)
        }
        return colors;
    }
}