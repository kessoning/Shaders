// Author @kesson - 2018
// Title: Ikeda inspired test pattern
// Edit from: https://thebookofshaders.com/edit.php#10/ikeda-00.frag by @patriciogv
// Shadertoy version: https://www.shadertoy.com/view/ld3yWB

precision mediump float;
uniform float time;
uniform vec2 resolution;

float random (in float x) {
    return fract(sin(x)*1e4);
}

float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

float randomSerie(float x, float freq, float t) {
    return step(.8,random( floor(x*freq)-floor(t) ));
}

void main(void) {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    st.x *= resolution.x / resolution.y;

    vec3 color = vec3(0.0);

    float cols = 1.0;
    if (floor(time) < 20.0) {
        cols = floor(time);
    } else {
        cols = 20.0;
    }

    float freq = random(floor(time))+abs(atan(time)*0.1);
    float t = time*(1.0-freq)*30.;

    if (fract(st.x*cols* 0.5) < 0.5){
        t *= -random(1.0);
    }

    freq += random(floor(st.y));

    float offset = .25;
    color = vec3(randomSerie(st.y, freq*100., t+offset),
                 randomSerie(st.y, freq*100., t),
                 randomSerie(st.y, freq*100., t-offset));

    gl_FragColor = vec4(color,1.0);
}
