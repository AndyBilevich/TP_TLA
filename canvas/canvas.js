// Canvas Prep
const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const c = canvas.getContext('2d');
const mouse = {};

//Constants
//let Gc = 6.67*10^(-11);
let Gc = 0.001;
let worldBorderBounce = true;
let bodyTrail = false;

// Event Listeners
window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('resize', () => {
    let restart = false;
    if (window.innerWidth < canvas.width || window.innerHeight < canvas.height) {
        restart = true;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (restart)
        init();
});

let keys = {};

window.addEventListener('keydown', (event) => {
    const key = event.key;
    keys[key] = true;
});

window.addEventListener('keyup', (event) => {
    const key = event.key;
    keys[key] = false;
});


//Classes
let time = 1;
let body_counter = 0;
function distance(pos1, pos2) {
    if (pos1 != undefined && pos1.x != undefined && pos1.y != undefined && pos2 != undefined && pos2.x != undefined && pos2.y != undefined) {
        let xDist = pos1.x - pos2.x;
        let yDist = pos1.y - pos2.y;
        return Math.sqrt(Math.pow(xDist,2) + Math.pow(yDist, 2));
    }
    else {
        throw Error('Missing parameters');
    }
}


function createMoon(body, altitude, mass, radius, color) {
    console.log(" g: " + Gc);
    let base_speed = Math.sqrt( (Gc * body.mass ) / (body.radius + altitude) );

    let px = body.position.x + body.radius + altitude;
    let py = body.position.y
    
    let delta_x = px - body.position.x
    let delta_y = body.position.y - py
    let angle = Math.atan2(delta_y, delta_x)

    console.log("base speed: " + base_speed);
    console.log("angle: " + angle);

    let vx = body.velocity.vx + (base_speed) * Math.sin(angle);
    let vy = body.velocity.vy + (base_speed)^3 * Math.cos(angle);

    let orviter = new Body(px, py, mass, radius, vx, vy, color);
    
    return orviter;
}

class Body{

    constructor(x, y, mass ,radius, vx, vy, color){
        this.position = {
            x: x,
            y: y
        }
        this.velocity = {
            vx: vx,
            vy: vy
        }
        this.mass = mass;
        this.radius = radius;
        this.color = color;
        this.id = body_counter++;
    }
    
    draw(){
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, 2*Math.PI);
        c.fill();
    }
    
    update(){
        this.calculateVelocity();
        this.calculatePosition();
        this.draw();
    }
    
    calculateVelocity(){

        if(worldBorderBounce){
            if(this.position.x + this.radius > window.innerWidth || this.position.x - this.radius < 0) {
                this.velocity.vx = -this.velocity.vx;
            }
        
            if(this.position.y + this.radius> window.innerHeight || this.position.y - this.radius < 0) {
                this.velocity.vy = -this.velocity.vy;
            }
        }

        let fx = 0;
        let fy = 0;
        let dist = 0;
        let collision_matrix = [];
        for ( var y = 0; y < body_counter; y++ ) {
            collision_matrix[ y ] = [];
            for ( var x = 0; x < body_counter; x++ ) {
                collision_matrix[ y ][ x ] = 0;
            }
        }
        bodies.forEach(body => {
            if(this.id != body.id){
                dist = distance(this.position, body.position);
            
                if(dist <= this.radius + body.radius){
                    this.makeCollision(body,dist);
                    collision_matrix[this.id][body.id] = 1;
                    collision_matrix[body.id][this.id] = 1;
                    // this.velocity.vx = ((this.mass - body.mass*col_e) * this.velocity.vx + (body.mass * (1+col_e) * body.velocity.vx))/(this.mass + body.mass)
                    // this.velocity.vy = ((this.mass - body.mass*col_e) * this.velocity.vy + (body.mass * (1+col_e) * body.velocity.vy))/(this.mass + body.mass)
                    // body.velocity.vx = ((body.mass - this.mass*col_e) * body.velocity.vx + (this.mass * (1+col_e) * this.velocity.vx))/(this.mass + body.mass)
                    // body.velocity.vy = ((body.mass - this.mass*col_e) * body.velocity.vy + (this.mass * (1+col_e) * this.velocity.vy))/(this.mass + body.mass)
                }else{
                    let force = (Gc * this.mass * body.mass)/(dist^2)
    
                    let delta_y = this.position.y-body.position.y;
                    let delta_x =  this.position.x -body.position.x ;
              
                    //let angle = Math.asin( (body.position.y - this.position.y) / dist );
                    let angle = Math.atan2( delta_y,delta_x )
    
                    fy += -force *  Math.sin(angle);
                    fx += -force * Math.cos(angle);
                }    
            }
        });

        let ascx = fx/this.mass;
        let ascy = fy/this.mass;

        this.velocity.vx += ascx * time;
        this.velocity.vy += ascy * time;
    }

    makeCollision(body,dist){
        let nx = (body.position.x - this.position.x) / dist; 
        let ny = (body.position.y - this.position.y) / dist; 
        let p = 2 * (this.velocity.vx * nx + this.velocity.vy * ny - body.velocity.vx * nx - body.velocity.vy * ny) / (this.mass + body.mass); 
        this.velocity.vx = this.velocity.vx - p * this.mass * nx; 
        this.velocity.vy= this.velocity.vy - p * this.mass * ny; 
        body.velocity.vx = body.velocity.vx + p * body.mass * nx; 
        body.velocity.vy = body.velocity.vy + p * body.mass * ny;
    }

    calculatePosition(){

        this.position.x += this.velocity.vx;
        this.position.y += this.velocity.vy;

    }

}

var bodies = [];

function init() {

    //here goes user code.
 
    let centery = window.innerHeight/2;
    let centerx = window.innerWidth/2;
    bodies = [];

    //intento con Gc real (hay que refactorear distancias)
    // bodies.push(new Body(centerx, centery,       1.989*(10^(30))  , 30, 0  , 0, "#FF6347")); 
    // bodies.push(new Body(centerx + 200, centery, 5.972*(10^(24))  , 10, 0, -30000, "#DA70D6"));

    //ejemplo lindo1
    // bodies.push(new Body(centerx, centery,       100000        , 30, 0  , 0     , "#FF6347")); 
    // bodies.push(new Body(centerx + 250, centery, 100           , 5 , 0  , -10   , "#87CEFA")); 
    // bodies.push(new Body(centerx + 450, centery, 100           , 5 , 0  , -10   , "#ababab")); 
    // bodies.push(new Body(centerx + 350, centery, 100           , 5 , 0  , -10   , "#ababab"));

    //ejemplo lindo2

    Gc = 0.00001

    bodies.push(new Body(centerx + 100, centery,       1000000        , 30, 0   , 2.3     , "#ebb00e")); 
    bodies.push(new Body(centerx - 100, centery,       1000000       , 30, 0   , -2.3     , "#ebb00e")); 
    bodies.push(new Body(centerx + 350, centery,        100           , 5 , 0  , -5   , "#ababab"));
    bodies.push(new Body(centerx + 250, centery,        100           , 5 , 0  , -4   , "#ababab"));

    //bodies.push(new Body(300, centery - 250, 100           , 5 , 12  , 0    , "#960eeb")); 



    //------------------------------------------------START





    //------------------------------------------------END



    //ejemplo de luna
    // let planet = new Body(centerx, centery, 10000, 30, 0, 0, "#87CEFA")
    // let moon = createMoon(planet, 100, 100, 10, "FFccFF")
    // //let moon2 = createMoon(moon, 15, 5, 3, "ffffff");
    // bodies.push(planet);
    // bodies.push(moon);
    //bodies.push(moon2)
}

function animate() {
    requestAnimationFrame(animate);
    if(!bodyTrail){
        c.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    bodies.forEach(body => {
        body.update();
    })
}

init();
animate();
