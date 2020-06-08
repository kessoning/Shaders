/*
 * "hades" by Giovanni Muzio - kesson | 2019
 * https://kesson.io | info@kesson.io
 * Shadertoy version: https://www.shadertoy.com/view/3sl3RX
 *
 * Porting of "Seascape" by Alexander Alekseev aka TDM
 * Original: https://www.shadertoy.com/view/Ms2SD1
 *
 * License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 *
 */

precision mediump float;
precision mediump int;

uniform float time;
uniform vec2 resolution;

const int NUM_STEPS = 8;
const float PI = 3.141592;

#define EPSILON_NRM (0.1 / resolution.x)

// land
const int ITER_GEOMETRY = 3;
const int ITER_FRAGMENT = 5;
const float LAND_HEIGHT = 1.0;
const float LAND_CHOPPY = 160.0;
const float LAND_SPEED = 0.0;
const float LAND_FREQ = 0.1;
const vec3 LAND_BASE = vec3(0.,0.,0.);
const vec3 LAND_WATER_COLOR = vec3(0.,0.,0.);
const mat2 octave_m = mat2(2.,1.2,-1.2,1.6);

// math
mat3 fromEuler(vec3 ang) {
	vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
	m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
	m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
	return m;
}
float hash( vec2 p ) {
	float h = dot(p,vec2(127.1,311.7));
    return fract(sin(h)*43758.5453123);
}
float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );
	vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ),
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ),
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

// lighting
float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
}
float specular(vec3 n,vec3 l,vec3 e,float s) {
    float nrm = (s + 8.0) / (PI * 8.);
    return pow(max(dot(reflect(e,n),l), 0.0), s) * nrm;
}

// sky
vec3 getSkyColor(vec3 e) {
    e.y = max(e.y,0.0);
    //return vec3(pow(1.0-e.y,2.0)*0.75, 1.0-pow(1.0-e.y,0.25), 1.0-pow(1.0-e.y,0.25));
    return vec3(pow(1.0-e.y,4.0)*0.75, 0.0, 0.0);
}

// land
float land_octave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

float map(vec3 p) {
    float freq = LAND_FREQ;
    float amp = LAND_HEIGHT;
    float choppy = LAND_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;

    float d, h = 0.0;
    for(int i = 0; i < ITER_GEOMETRY; i++) {
    	d = land_octave((uv+1.0)*freq,choppy);
    	d += land_octave((uv-1.0)*freq,choppy);
        h += d * amp;
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

float map_detailed(vec3 p) {
    float freq = LAND_FREQ;
    float amp = LAND_HEIGHT;
    float choppy = LAND_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;

    float d, h = 0.0;
    for(int i = 0; i < ITER_FRAGMENT; i++) {
    	d = land_octave((uv+1.0)*freq,choppy);
    	d += land_octave((uv-1.0)*freq,choppy);
        h += d * amp;
    	uv *= octave_m; freq *= 2.0; amp *= 0.2;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

vec3 getLandColor(vec3 n, vec3 l, vec3 eye, vec3 dist) {
    float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 2.0);
    fresnel = pow(fresnel,3.0) * 0.65;

    vec3 reflected = getSkyColor(reflect(eye,n));
    vec3 refracted = LAND_BASE + diffuse(n,l,80.0) * LAND_WATER_COLOR * 0.12;

    vec3 color = mix(refracted,reflected,fresnel);

    color += vec3(specular(n,l,eye, 40.0));

    return color;
}

// tracing
vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {
    float tm = 0.0;
    float tx = 1000.0;
    float hx = map(ori + dir * tx);
    if(hx > 0.0) return tx;
    float hm = map(ori + dir * tm);
    float tmid = 0.0;
    for(int i = 0; i < NUM_STEPS; i++) {
        tmid = mix(tm,tx, hm/(hm-hx));
        p = ori + dir * tmid;
    	float hmid = map(p);
		if(hmid < 0.0) {
        	tx = tmid;
            hx = hmid;
        } else {
            tm = tmid;
            hm = hmid;
        }
    }
    return tmid;
}

// main
void main( void ) {
	vec2 uv = gl_FragCoord.xy / resolution.xy;
    uv = uv * 4.0 - 2.0;
    float t = time * 0.2;

    // ray
    vec3 ang = vec3(sin(t)*0.1,sin(t)*0.2+0.3,t*0.1);
    vec3 ori = vec3(0.0,9.5,t);
    vec3 dir = normalize(vec3(uv.xy,-2.0)); dir.z += length(uv) * 0.15;
    dir = normalize(dir) * fromEuler(ang);

    // tracing
    vec3 p = vec3(0.0);
    heightMapTracing(ori,dir,p);
    vec3 dist = p - ori;
    vec3 n = getNormal(p, dot(dist,dist) * EPSILON_NRM);
    vec3 light = normalize(vec3(0.0,1.0,0.8));

    // color
    vec3 color = mix(
        getSkyColor(dir),
        getLandColor(n,light,dir,dist),
    	pow(smoothstep(0.0,-0.05,dir.y),0.3));

    // post
    vec4 col = vec4(pow(color,vec3(0.75)), 1.0);
    gl_FragColor = vec4(col.xyz, 1.0);
}
