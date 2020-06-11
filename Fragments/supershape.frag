/* Copyright 2020 - Giovanni Muzio
 * Based on a personal live coding sketch from Processing
 * https://github.com/netherlands-coding-live/community-code/tree/master/kesson
 *
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

precision mediump float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define RAYMARCH_MAX_STEPS 		512
#define RAYMARCH_MAX_DIST 		1000.0
#define RAYMARCH_SURFACE_DIST 	0.0001

vec2 getAngle(vec3 p) {
    float theta = asin(p.z / length(p));
    float phi = atan(p.y, p.x);
    return vec2(theta, phi);
}

float supershape(float theta, float m, float n1, float n2, float n3) {
  float t1 = abs(cos(m * theta / 4.0));
  t1 = pow(t1, n2);

  float t2 = abs(sin(m * theta / 4.0));
  t2 = pow(t2, n3);

  float t3 = t1 + t2;
  float r = pow(t3, -1.0 / n1);

  return r;
}

float getDist(vec3 p) {
	vec2 angle = getAngle(p);

    angle.x -= time * 0.2;

    float r1 = supershape(angle.x,
                          12.0,
                          abs(cos(time*0.75)) + 0.1,
                          abs(sin(time*0.075)) + 0.1,
                          abs(cos(time*0.05)) + 0.1);

    float r2 = supershape(angle.y,
                          4.0 + sin(time*0.123) * 8.0,
                          (abs(sin(time*0.0756)) + 0.234) * 100.0,
                          (abs(cos(time*0.0765)) + 0.234) * 100.0,
                          (abs(cos(time*0.0675)) + 0.234) * 10.0);

    vec3 f = vec3(r1 * sin(angle.x) * r2 * cos(angle.y),
                  r1 * sin(angle.x) * r2 * sin(angle.y),
                  r2 * cos(angle.x));

    return (length(p) - length(f)) * 0.1;
}

float rayMarch(in vec3 ro, in vec3 rd, out int mr) {
	float dO = 0.0;

    for (int i = 0; i < RAYMARCH_MAX_STEPS; i++) {
		vec3 p = ro + rd * dO;
        float dS = getDist(p);
        dO += dS;
        if (dO > RAYMARCH_MAX_DIST) break;
        if (dS < RAYMARCH_SURFACE_DIST) {
            mr = 1;
            break;
        }
    }

    return dO;
}

vec3 getNormal(vec3 p) {
	float d = getDist(p);
    vec2 e = vec2(0.01, 0.0);

    vec3 n = d - vec3(
        getDist(p - e.xyy),
        getDist(p - e.yxy),
        getDist(p - e.yyx));

    return normalize(n);
}

float getLight(vec3 p) {
  vec3 lightPos = vec3(0.0, 5.0, 0.0);
  vec3 l = normalize(lightPos - p);
  vec3 n = getNormal(p);

    return 1.0;
}

vec3 getDiff(vec3 p, vec3 rd) {
    vec3 n = getNormal(p);
    return reflect(rd, n);
}

// From https://www.shadertoy.com/view/lsKcDD
// https://iquilezles.org/www/articles/rmshadows/rmshadows.htm
float shadowMarch( vec3 ro, vec3 rd ) {
	float dO = 0.01;
    float res = 1.0;

    for (int i = 0; i < 64; i++) {
		float h = getDist( ro + rd * dO );

        res = min( res, 10.0 * h / dO );
        dO += h;

        if( res < 0.0001 || dO > RAYMARCH_MAX_DIST ) break;
    }

    return res;//clamp( res, 0.0, 1.0 );
}

void main( void ) {

    vec2 uv = (gl_FragCoord.xy-0.5 * resolution.xy) / resolution.y;

    float an = -time * 0.1;

    // Camera matrix and movement from https://www.shadertoy.com/view/ldl3Dl
    vec3 ro = vec3( 7.5*cos(an), 0.0, 7.5*sin(an) );
    vec3 ta = vec3( 0.0, 0.0, 0.0 );
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    vec3 rd = normalize( uv.x*uu + uv.y*vv + 2.0*ww );

    int mr = 0;
    float d = rayMarch(ro, rd, mr);

    vec3 col = vec3(0.0);

    if (mr == 1) {
        vec3 p = ro + rd * d;
        vec3 dif = getDiff(p, rd);
      	vec3 lightPos = normalize(vec3(0.0, 1000.0, 0.0));
        vec3 l = normalize(lightPos - p);
      	vec3 n = getNormal(p);
        float s = 1.0 + dot(n, l);
        float d = shadowMarch( p, lightPos );
        col = vec3(s)*(0.5 + d);
    }

    gl_FragColor = vec4(col,1.0);
}
