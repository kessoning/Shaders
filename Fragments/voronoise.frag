// Author: kesson - 2018
// Learning GLSL, from thebookofshaders.com
// Shadertoy version: https://www.shadertoy.com/view/4s3yDs
//
// Fork rom @patriciogv | https://thebookofshaders.com/edit.php#12/vorono-01.frag
// Inspired by a previous video of mine https://www.youtube.com/watch?v=NfYVUIUxToc

precision mediump float;

uniform vec2 resolution;
uniform float time;

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main( void ) {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    st.x *= resolution.x / resolution.y;
    vec3 color = vec3(.0);

    // Scale
    st *= 3.;

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    float m_dist = 10.;  // minimun distance
    vec2 m_point;        // minimum point

    for (int j=-1; j<=1; j++ ) {
        for (int i=-1; i<=1; i++ ) {
            vec2 neighbor = vec2(float(i),float(j));
            vec2 point = random2(i_st + neighbor);
            point = 0.5 + 0.5*sin(time + 6.2831*point);
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);

            if( dist < m_dist ) {
                m_dist = dist;
                m_point = point;
            }
        }
    }

    // Add distance field to closest point center
    color = vec3(m_dist, m_dist*cos(mod(time, 6.28)), m_dist*sin(mod(time, 6.28)));

    // Draw cell center
    color += 0.5-step(.0, m_dist);

    gl_FragColor = vec4(color, 1.0);
}
