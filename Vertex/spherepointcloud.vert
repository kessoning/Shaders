/* Simple Vertex Shader animation
 * Live version: https://www.vertexshaderart.com/art/4FQ77YanjkTRoSWip/revision/2wgjj2Adrgfg2rwhq
 *
 * Based on https://www.vertexshaderart.com/art/nL6YpkW8YvGKNEKtj
 */

/*{
  "pixelRatio": 1,
  "vertexCount": 100000,
  "vertexMode": "POINTS",
}*/
precision mediump float;
attribute float vertexId;
uniform float vertexCount;
uniform float time;
uniform vec2 resolution;
varying vec4 v_color;

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

mat4 rotateX(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat4(
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1);
}

mat4 rotateY(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat4(
      c, 0,-s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1);
}

mat4 rotateZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat4(
      c,-s, 0, 0,
      s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1);
}

vec3 posf2(float t, float i) {
	return vec3(
      cos(t*.4+i*1.53) +
      sin(t*1.84+i*.76) +
      noise(vec2(t, i)),
      cos(t*1.4+i*1.353-2.1) +
      sin(t*1.84+i*.476-2.1) +
      noise(vec2(t*.3, i)),
      sin(t*1.84+i*.36+2.1)// +
	)*.2;
}

vec3 posf0(float t) {
  return posf2(t,-1.)*.5;
}

vec3 posf(float t, float i) {
  return posf2(t*.03,i) + posf0(t);
}

vec3 push(float t, float i, vec3 ofs, float lerpEnd) {
  vec3 pos = posf(t,i)+ofs;

  vec3 posf = fract(pos+.5)-.5;

  float l = length(posf)*2.;
  return (- posf + posf/l)*(1.-smoothstep(lerpEnd,1.,l));
}

void main(void) {
  // more or less random movement
  float t = time*.1;
  float i = vertexId+sin(vertexId)*100.;

  vec3 pos = posf(t,i);
  vec3 ofs = vec3(0);
  for (float f = -10.; f < 0.; f++) {
	  ofs += push(t+f*.05,i,ofs,2.-exp(-f*.1));
  }
  ofs += push(t,i,ofs,.999);

  pos -= posf0(t);

  pos += ofs;

  pos.yz *= mat2(.8,.6,-.6,.8);
  pos.xz *= mat2(.8,.6,-.6,.8);

  pos.x *= resolution.y/resolution.x;
  pos.z *= resolution.y/resolution.x;

  mat4 rotation = rotateY(time*0.1);
  vec4 rot = vec4(pos.xyz, 1.0) * rotation;

  pos.z += .5;

  rot *= 2.0;

  gl_Position = vec4(rot.xyz, 1);
  gl_PointSize = 1.;

  v_color = vec4(1.0, 1.0, 1.0, 1.0);
}
