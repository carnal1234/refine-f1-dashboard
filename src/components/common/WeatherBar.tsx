import { Row, Col } from 'antd';


const TemperatureSvg =
  <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none" className="absolute">
    <defs><linearGradient id="temperature"><stop offset="0%" stop-color="#BFDC30"></stop><stop offset="10%" stop-color="#B3FE00"></stop><stop offset="30%" stop-color="#FFE620"></stop><stop offset="60%" stop-color="#FF9500"></stop><stop offset="90%" stop-color="#FA114F"></stop></linearGradient><linearGradient id="humidity"><stop offset="0%" stop-color="#01DF6E"></stop><stop offset="10%" stop-color="#55CAF1"></stop><stop offset="30%" stop-color="#4EBCFA"></stop><stop offset="60%" stop-color="#36A6F9"></stop><stop offset="90%" stop-color="#5855D6"></stop></linearGradient></defs><path d="M 42.235999970177005 39.462721217947134 A 22.5 22.5 0 1 0 7.764000029822995 39.462721217947134" stroke-width="5" stroke="url(#temperature)" stroke-linecap="round"></path><circle cx="28.390428525613366" cy="2.756911311314987" z="10" r="3.5" fill="none" stroke="black" stroke-width="3"></circle>
  </svg>

const humiditySvg = <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none" className="absolute"><defs><linearGradient id="temperature"><stop offset="0%" stop-color="#BFDC30"></stop><stop offset="10%" stop-color="#B3FE00"></stop><stop offset="30%" stop-color="#FFE620"></stop><stop offset="60%" stop-color="#FF9500"></stop><stop offset="90%" stop-color="#FA114F"></stop></linearGradient><linearGradient id="humidity"><stop offset="0%" stop-color="#01DF6E"></stop><stop offset="10%" stop-color="#55CAF1"></stop><stop offset="30%" stop-color="#4EBCFA"></stop><stop offset="60%" stop-color="#36A6F9"></stop><stop offset="90%" stop-color="#5855D6"></stop></linearGradient></defs><path d="M 42.235999970177005 39.462721217947134 A 22.5 22.5 0 1 0 7.764000029822995 39.462721217947134" stroke-width="5" stroke="url(#humidity)" stroke-linecap="round"></path><circle cx="30.06139872273696" cy="3.0766735423322054" z="10" r="3.5" fill="none" stroke="black" stroke-width="3"></circle></svg>

const cloudRainSvg =
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path stroke="#fff" fill="none" strokeWidth="1" d="M20.33 2a9.72 9.72 0 0 0-6.12 2.17A5 5 0 0 0 6 7.59a7.08 7.08 0 0 0-4 6.23v.08a7 7 0 0 0 .56 2.74 2.15 2.15 0 0 0 .11.22A7.11 7.11 0 0 0 9.1 21h12.56a7.05 7.05 0 0 0 6-3.32A9.38 9.38 0 0 0 30 11.5 9.6 9.6 0 0 0 20.33 2zM11 5a3 3 0 0 1 1.8.6 9.58 9.58 0 0 0-1.13 1.69 7.43 7.43 0 0 0-2.48-.43 7.93 7.93 0 0 0-1 .07A3 3 0 0 1 11 5zm15.11 11.42a.71.71 0 0 0-.1.14A5.08 5.08 0 0 1 21.66 19H9.1a5.13 5.13 0 0 1-4.62-2.95l-.05-.11v-.1A4.74 4.74 0 0 1 4 14v-.14a5.15 5.15 0 0 1 5.19-5 5.27 5.27 0 0 1 2.52.64 1 1 0 0 0 .83.05 1 1 0 0 0 .59-.55 7.68 7.68 0 0 1 7.2-5A7.59 7.59 0 0 1 28 11.5a7.4 7.4 0 0 1-1.89 4.92z" /><path stroke="#fff" fill="none" strokeWidth="1" d="M23.55 6.17a1 1 0 0 0-1.1 1.66A4.59 4.59 0 0 1 24 12.76a1 1 0 0 0 .76 1.24H25a1 1 0 0 0 1-.76 6.51 6.51 0 0 0-2.45-7.07zM11 23a1 1 0 0 0-1 1v5a1 1 0 0 0 2 0v-5a1 1 0 0 0-1-1zM16 23a1 1 0 0 0-1 1v2.5a1 1 0 0 0 2 0V24a1 1 0 0 0-1-1zM21 23a1 1 0 0 0-1 1v3.75a1 1 0 0 0 2 0V24a1 1 0 0 0-1-1z" /></svg>


const sunnySvg =
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path stroke="#fff" fill="none" strokeWidth="1" d="M7 12a5 5 0 1 1 5 5 5 5 0 0 1-5-5zm5-7a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v1a1 1 0 0 0 1 1zm-1 15v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-2 0zm10-9h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zM3 13h1a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2zm14.657-5.657a1 1 0 0 0 .707-.293l.707-.707a1 1 0 1 0-1.414-1.414l-.707.707a1 1 0 0 0 .707 1.707zM5.636 16.95l-.707.707a1 1 0 1 0 1.414 1.414l.707-.707a1 1 0 0 0-1.414-1.414zm11.314 0a1 1 0 0 0 0 1.414l.707.707a1 1 0 0 0 1.414-1.414l-.707-.707a1 1 0 0 0-1.414 0zM5.636 7.05A1 1 0 0 0 7.05 5.636l-.707-.707a1 1 0 0 0-1.414 1.414z" /></svg>


interface WeatherBarProps {
  trackTemperature: number,
  airTemperature: number,
  humidity: number,
  rainfall: number,
  windSpeed: number
}


const WeatherBar = ({
  trackTemperature,
  airTemperature,
  humidity,
  rainfall,
  windSpeed
}: WeatherBarProps) => {
  return (
    <Row justify="space-between" gutter={[16, 16]} style={{ padding: '10px', background: '#000', borderRadius: '8px' }}>
      {/* Temperature */}
      <Col>
        <div style={{ position: 'relative', width: 55, height: 55, borderRadius: '50%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Replace with your SVG or icon component */}
          {TemperatureSvg}
          <div style={{ position: 'absolute', bottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '16px', color: '#F2F2F2' }}>{trackTemperature}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#67E151' }}>TRC</p>
          </div>
        </div>
      </Col>

      <Col>
        <div style={{ position: 'relative', width: 55, height: 55, borderRadius: '50%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Replace with your SVG or icon component */}
          {TemperatureSvg}
          <div style={{ position: 'absolute', bottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '16px', color: '#F2F2F2' }}>{airTemperature}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#67E151' }}>AIR</p>
          </div>
        </div>
      </Col>

      {/* Humidity */}
      <Col>
        <div style={{ position: 'relative', width: 55, height: 55, borderRadius: '50%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Replace with your SVG or icon component */}
          {humiditySvg}
          <div style={{ position: 'absolute', bottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '16px', color: '#F2F2F2' }}>{humidity}</p>
            <img src="/humidity.svg" alt="humidity icon" style={{ width: '13px', height: '12px' }} />
          </div>
        </div>
      </Col>

      <Col>
        <div style={{ position: 'relative', width: 55, height: 55, borderRadius: '50%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Replace with your SVG or icon component */}
          {rainfall && rainfall > 0 ? cloudRainSvg : sunnySvg}

        </div>
      </Col>

      {/* Wind */}
      <Col>
        <div style={{ position: 'relative', width: 55, height: 55, borderRadius: '50%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Wind SVG or icon */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#3b82f6' }}>SW</p>
            <p style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{windSpeed}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#fff' }}>m/s</p>
          </div>
        </div>
      </Col>
    </Row >
  );
};

export default WeatherBar;