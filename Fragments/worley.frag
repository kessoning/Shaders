
/*
 * Raymarching and Worley Noise
 * Made while learning some GLSL techniques
 * Shadertoy version: https://www.shadertoy.com/view/3lXyzM
 *
 * Thanks to https://www.youtube.com/watch?v=PGtv-dBi2wE for the Ray Marching tutorial
 * Thanks to https://www.youtube.com/watch?v=4066MndcyCk for the Worley Noise tutorial
 *
 */

precision mediump float;
uniform float time;
uniform vec2 resolution;

#define RAYMARCH_MAX_STEPS 		100
#define RAYMARCH_MAX_DIST 		50.0
#define RAYMARCH_SURFACE_DIST 	0.01

// From https://www.youtube.com/watch?v=l-07BXzNdPw
vec3 randomVector(vec3 p) {
	vec3 a = fract(p.xyz*vec3(123.34, 234.34, 345.65));
    a += dot(a, a+34.45);
    vec3 v = fract(vec3(a.x*a.y, a.y*a.z, a.z*a.x));
    return v;
}

vec2 worley(vec3 uv, float t, float factor) {
    vec3 st = uv * factor;
    vec2 minDist = vec2(1000.0);
 	vec3 gv = fract(st)-0.5;
    vec3 id = floor(st);

    for (float z = -1.0; z <= 1.0; z++) {

        for (float y = -1.0; y <= 1.0; y++) {

            for (float x = -1.0; x <= 1.0; x++) {

                vec3 offs = vec3(x, y, z);

                vec3 n = randomVector(id + offs);
                vec3 p = offs + sin(n * t) * .5;
                p -= gv;

                float d = length(p);

                if (d < minDist.x) {
                    minDist.y = minDist.x;
                    minDist.x = d;
                } else if (d < minDist.y) {
                    minDist.y = d;
                }

            }
        }

    }

    return minDist;
}

float getDist(vec3 p, float wr) {
	vec4 sphere = vec4(0.0, 1.0, 0.0, 1.0 + wr);

    float sphereDist = length(p - sphere.xyz) - sphere.w;
    float planeDist = (p.y+0.75) - wr;

    return min(sphereDist, planeDist);
}

float rayMarch(vec3 ro, vec3 rd) {
	float dO = 0.0;

    for (int i = 0; i < RAYMARCH_MAX_STEPS; i++) {
		vec3 p = ro + rd * dO;
        vec2 worleyF = worley(p, time, 2.0);
        float dS = getDist(p, (worleyF.y - worleyF.x)*0.2);
        dO += dS;
        if (dO > RAYMARCH_MAX_DIST || dS < RAYMARCH_SURFACE_DIST) break;
    }

    vec3 d = ro + rd * dO;

    vec2 worleyF = worley(d, time, 2.0);

    return dO;
}

vec3 getNormal(vec3 p, float wr) {
	float d = getDist(p, wr);
    vec2 e = vec2(0.01, 0.0);

    vec3 n = d - vec3(
        getDist(p - e.xyy, wr),
        getDist(p - e.yxy, wr),
        getDist(p - e.yyx, wr));

    return normalize(n);
}

float getLight(vec3 p) {
    float an = time*0.1;
    vec3 lightPos = vec3(sin(an) * 4.0, 4.0, cos(an) * 4.0);
    vec3 l = normalize(lightPos - p);
    vec2 worleyF = worley(p, time, 2.0);
    vec3 n = getNormal(p, (worleyF.y-worleyF.x));

    float dif = dot(n, l);

    float d = rayMarch(p + RAYMARCH_SURFACE_DIST * 120.0, l);
    if (d < length(lightPos-p)) dif *= 0.25;

    return dif;
}

void main(void) {

    vec2 uv = (2.0 * gl_FragCoord.xy - resolution.xy) / resolution.y;

    float an = time * 0.1;
    // Camera matrix and movement from https://www.shadertoy.com/view/ldl3Dl
    vec3 ro = vec3( 2.5*cos(an), 1.0, 2.5*sin(an) );//vec3(0.0, 1.0, 0.0);
    vec3 ta = vec3( 0.0, 1.0, 0.0 );
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    vec3 rd = normalize( uv.x*uu + uv.y*vv + 1.5*ww );//normalize(vec3(uv.x, uv.y, 1.0));

    float d = rayMarch(ro, rd);

    vec3 p = ro + rd * d;

    vec2 worleyF = worley(p, time, 2.0);

    float dif = clamp(getLight(p), 0.0, 1.0);

    d /= 5.0;//
    vec3 col = vec3(d) * vec3(dif);
    float distort = worleyF.y - worleyF.x;
    col = vec3(dif) * distort;

    gl_FragColor = vec4(col,1.0);
}
