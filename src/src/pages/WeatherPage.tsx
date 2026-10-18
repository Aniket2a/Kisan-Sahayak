import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { INDIAN_AGRI_CITIES } from '../data/seedData';
import { WeatherData, AgriTip, WeatherForecastDay } from '../types';
import { Language } from '../translations';

function parseWmoCode(code: number, lang: Language): { condition: string; icon: string } {
  const isHi = lang === 'hi';
  const isMr = lang === 'mr';

  if (code === 0) {
    return {
      condition: isHi ? 'साफ आसमान / धूप' : isMr ? 'निरभ्र आकाश / सूर्यप्रकाश' : 'Clear Sky / Sunny',
      icon: 'fa-sun'
    };
  }
  if (code === 1 || code === 2) {
    return {
      condition: isHi ? 'आंशिक रूप से बादल' : isMr ? 'अंशतः ढगाळ वातावरण' : 'Partly Cloudy',
      icon: 'fa-cloud-sun'
    };
  }
  if (code === 3) {
    return {
      condition: isHi ? 'घने बादल' : isMr ? 'पूर्णतः ढगाळ आकाश' : 'Overcast Clouds',
      icon: 'fa-cloud'
    };
  }
  if (code === 45 || code === 48) {
    return {
      condition: isHi ? 'कोहरा / धुंध' : isMr ? 'धुके व थंड वातावरण' : 'Fog / Mist',
      icon: 'fa-smog'
    };
  }
  if ([51, 53, 55, 61, 63].includes(code)) {
    return {
      condition: isHi ? 'मध्यम बारिश / बौछारें' : isMr ? 'हलका ते मध्यम पाऊस' : 'Moderate Rain / Showers',
      icon: 'fa-cloud-rain'
    };
  }
  if ([65, 80, 81, 82].includes(code)) {
    return {
      condition: isHi ? 'भारी मानसूनी बारिश' : isMr ? 'मुसळधार पाऊस' : 'Heavy Monsoon Rain',
      icon: 'fa-cloud-showers-heavy'
    };
  }
  if ([95, 96, 99].includes(code)) {
    return {
      condition: isHi ? 'गरज-चमक के साथ तूफान' : isMr ? 'विजांच्या कडकडाटासह पाऊस' : 'Thunderstorm & Lightning',
      icon: 'fa-bolt'
    };
  }
  return {
    condition: isHi ? 'हल्के बादल' : isMr ? 'अंशतः ढग' : 'Scattered Clouds',
    icon: 'fa-cloud-sun'
  };
}

function generateAgriTips(
  temp: number,
  humidity: number,
  wind: number,
  precip: number,
  forecast: WeatherForecastDay[],
  lang: Language
): AgriTip[] {
  const tips: AgriTip[] = [];
  const maxRain = forecast.length > 0 ? Math.max(...forecast.map(f => f.rain_prob)) : 20;
  const isHi = lang === 'hi';
  const isMr = lang === 'mr';

  if (maxRain > 60 || precip > 2.0) {
    tips.push({
      type: 'warning',
      icon: 'fa-triangle-exclamation',
      title: isHi
        ? 'वर्षा चेतावनी — कीटनाशक व उर्वरक छिड़काव स्थगित करें'
        : isMr
        ? 'पावसाचा इशारा — औषध फवारणी व खत देणे पुढे ढकला'
        : 'Rain Alert — Delay Pesticide & Fertilizer Spray',
      text: isHi
        ? 'तेज बारिश की संभावना है। रासायनिक दवाओं, कीटनाशकों और पकी हुई दलहन/सब्जियों की कटाई को टालें ताकि दवा बह न जाए।'
        : isMr
        ? 'पावसाची दाट शक्यता असल्याने कीटकनाशक फवारणी व विद्राव्य खतांचा वापर थांबवा. काढणीस आलेली पिके सुरक्षित ठिकाणी ठेवा.'
        : 'High probability of showers expected. Delay foliar chemical sprays, pesticide applications, and harvesting of mature pulses or vegetables to prevent wash-off.'
    });
  } else if (maxRain < 25 && temp > 32) {
    tips.push({
      type: 'info',
      icon: 'fa-droplet',
      title: isHi
        ? 'सिंचाई समय निर्धारण परामर्श'
        : isMr
        ? 'पाणी व्यवस्थापन व सिंचन सल्ला'
        : 'Irrigation Scheduling Advisory',
      text: isHi
        ? 'शुष्क व गर्म मौसम को देखते हुए सुबह (6 AM – 9 AM) या शाम के समय हल्की ड्रिप या नाली सिंचाई करें जिससे वाष्पीकरण कम हो।'
        : isMr
        ? 'उष्ण व कोरड्या हवामानामुळे पाण्याची वाफ होण्याचे प्रमाण जास्त राहू शकते. सकाळी किंवा संध्याकाळी ठिबक सिंचनाने पाणी द्यावे.'
        : 'Warm and dry conditions prevailing. Schedule light drip or furrow irrigation during early morning (6 AM – 9 AM) or evening to minimize evaporative water loss.'
    });
  }

  if (wind > 18) {
    tips.push({
      type: 'warning',
      icon: 'fa-wind',
      title: isHi
        ? `तेज हवा चेतावनी (${wind} किमी/घंटा) — लंबी फसलों को सहारा दें`
        : isMr
        ? `जोराच्या वाऱ्याचा इशारा (${wind} किमी/तास) — उंच पिकांना आधार द्या`
        : 'High Wind Warning — Support Tall Crops',
      text: isHi
        ? `हवा की गति ${wind} किमी/घंटा तक रहने का अनुमान है। गन्ना, मक्का और केले की फसलों को गिरने से बचाने के लिए सहारा दें।`
        : isMr
        ? `वाऱ्याचा वेग ${wind} किमी/तास राहण्याचा अंदाज असल्याने ऊस, मका व केळी यांसारख्या पिकांना मातीची भर लावा किंवा आधार द्या.`
        : `Gusty winds up to ${wind} km/h detected. Provide staking/earthing up support for sugarcane, maize, and banana crops to prevent lodging.`
    });
  } else {
    tips.push({
      type: 'success',
      icon: 'fa-spray-can-sparkles',
      title: isHi
        ? 'खेत कार्यों व निराई-गुड़ाई के लिए अनुकूल मौसम'
        : isMr
        ? 'शेतातील आंतरमशागत व कामांसाठी अनुकूल हवामान'
        : 'Optimal Weather Window for Field Operations',
      text: isHi
        ? 'शांत हवा और मध्यम नमी को देखते हुए ट्रैक्टर से जुताई, खरपतवार नियंत्रण और बीज बुवाई के लिए यह अनुकूल समय है।'
        : isMr
        ? 'मंद वारा आणि योग्य आर्द्रतेमुळे कोळपणी, खुरपणी व आंतरमशागतीची कामे वेळेवर पूर्ण करून घ्या.'
        : 'Gentle wind speed and moderate humidity make this an optimal time for tractor weeding, intercultural hoeing, and seedbed preparation.'
    });
  }

  if (temp > 35) {
    tips.push({
      type: 'danger',
      icon: 'fa-temperature-arrow-up',
      title: isHi
        ? 'लू एवं अत्यधिक तापमान से बचाव परामर्श'
        : isMr
        ? 'उष्णतेची लाट व उन्हापासून पीक-पशु संरक्षण'
        : 'Heat Stress Protection for Livestock & Crops',
      text: isHi
        ? 'अधिक तापमान के कारण पशुओं के शेड में स्वच्छ पेयजल की व्यवस्था रखें और सब्जियों में मल्चिंग करें जिससे नमी बनी रहे।'
        : isMr
        ? 'वाढत्या तापमानापासून जनावरांचे रक्षण करा, गोठ्यात पाण्याची सोय ठेवा आणि भाजीपाला पिकांमध्ये ओलावा टिकवण्यासाठी आच्छादन (मल्चिंग) वापरा.'
        : 'High temperature window. Ensure clean drinking water in cattle sheds and maintain organic mulching across vegetable beds to conserve soil moisture.'
    });
  } else if (temp < 14) {
    tips.push({
      type: 'info',
      icon: 'fa-snowflake',
      title: isHi
        ? 'शीत लहर व ठंड से संवेदनशील फसलों का बचाव'
        : isMr
        ? 'थंडीपासून संवेदनशील पिकांचे संरक्षण'
        : 'Cold Weather Advisory — Monitor Sensitive Crops',
      text: isHi
        ? 'ठंडे मौसम के प्रभाव से नवोदित पौधों को बचाने के लिए शाम को हल्की सिंचाई करें ताकि पाले का असर कम हो।'
        : isMr
        ? 'थंडीपासून कोवळ्या रोपांचे रक्षण करण्यासाठी शेताच्या बांधांवर संध्याकाळी हलके पाणी द्यावे किंवा धूर करावा.'
        : 'Cool weather prevailing. Keep field borders slightly moist in evening hours to protect young seedlings from cold drafts and blight infection.'
    });
  }

  return tips;
}

export const WeatherPage: React.FC = () => {
  const { t, language } = useApp();
  const [selectedCityKey, setSelectedCityKey] = useState<string>('ludhiana');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const cityInfo = INDIAN_AGRI_CITIES[selectedCityKey] || INDIAN_AGRI_CITIES['ludhiana'];

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network response not ok');
        const data = await res.json();

        if (isCancelled) return;

        const current = data.current || {};
        const daily = data.daily || {};

        const temp = Math.round((current.temperature_2m ?? 29.5) * 10) / 10;
        const humidity = current.relative_humidity_2m ?? 62;
        const wind = Math.round((current.wind_speed_10m ?? 12.0) * 10) / 10;
        const code = current.weather_code ?? 1;
        const precip = current.precipitation ?? 0.0;

        const { condition, icon } = parseWmoCode(code, language);

        const forecast: WeatherForecastDay[] = [];
        const dates: string[] = daily.time || [];
        const codes: number[] = daily.weather_code || [];
        const maxTemps: number[] = daily.temperature_2m_max || [];
        const minTemps: number[] = daily.temperature_2m_min || [];
        const rainProbs: number[] = daily.precipitation_probability_max || [];

        for (let i = 0; i < Math.min(5, dates.length); i++) {
          const dDate = dates[i];
          let dayName = `Day ${i + 1}`;
          try {
            const dt = new Date(dDate);
            const locale = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
            dayName = dt.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
          } catch {
            dayName = `Day ${i + 1}`;
          }

          const parsed = parseWmoCode(codes[i] ?? 0, language);
          forecast.push({
            day: dayName,
            max_temp: Math.round((maxTemps[i] ?? 32) * 10) / 10,
            min_temp: Math.round((minTemps[i] ?? 22) * 10) / 10,
            rain_prob: rainProbs[i] ?? 15,
            condition: parsed.condition,
            icon: parsed.icon
          });
        }

        const tips = generateAgriTips(temp, humidity, wind, precip, forecast, language);

        setWeatherData({
          temp,
          condition,
          icon,
          humidity,
          wind,
          rain_prob: forecast[0]?.rain_prob ?? 20,
          forecast,
          tips,
          is_live: true
        });
      } catch {
        if (isCancelled) return;
        const parsedCond = parseWmoCode(1, language);
        const todayLabel = language === 'mr' ? 'आज' : language === 'hi' ? 'आज' : 'Today';
        const tomorrowLabel = language === 'mr' ? 'उद्या' : language === 'hi' ? 'कल' : 'Tomorrow';
        const dayLabel = (n: number) => (language === 'mr' ? `दिवस ${n}` : language === 'hi' ? `दिन ${n}` : `Day ${n}`);

        const fallbackForecast: WeatherForecastDay[] = [
          { day: todayLabel, max_temp: 31.0, min_temp: 22.0, rain_prob: 20, condition: parsedCond.condition, icon: 'fa-cloud-sun' },
          { day: tomorrowLabel, max_temp: 32.5, min_temp: 21.5, rain_prob: 15, condition: parseWmoCode(0, language).condition, icon: 'fa-sun' },
          { day: dayLabel(3), max_temp: 30.0, min_temp: 23.0, rain_prob: 45, condition: parseWmoCode(51, language).condition, icon: 'fa-cloud-rain' },
          { day: dayLabel(4), max_temp: 29.0, min_temp: 22.0, rain_prob: 60, condition: parseWmoCode(65, language).condition, icon: 'fa-cloud-showers-heavy' },
          { day: dayLabel(5), max_temp: 31.5, min_temp: 21.0, rain_prob: 10, condition: parseWmoCode(0, language).condition, icon: 'fa-sun' }
        ];
        const tips = generateAgriTips(28.5, 65, 11.2, 0.0, fallbackForecast, language);
        setWeatherData({
          temp: 28.5,
          condition: parsedCond.condition,
          icon: 'fa-cloud-sun',
          humidity: 65,
          wind: 11.2,
          rain_prob: 20,
          forecast: fallbackForecast,
          tips,
          is_live: false
        });
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchWeather();

    return () => {
      isCancelled = true;
    };
  }, [selectedCityKey, cityInfo, language]);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* PAGE HEADER */}
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <span className="section-badge" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', borderColor: '#bae6fd' }}>
          <i className="fa-solid fa-cloud-sun-rain"></i> {t('weather_badge')}
        </span>
        <h1 className="section-title">{t('weather_title')}</h1>
        <p className="section-subtitle" style={{ margin: 0 }}>
          {t('weather_sub')}
        </p>
      </div>

      {/* CITY SELECTION STRIP */}
      <div style={{ marginBottom: '2rem', background: '#fff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              {t('weather_select_hub')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={selectedCityKey}
                onChange={(e) => setSelectedCityKey(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--primary-green)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--forest-dark)',
                  backgroundColor: 'var(--mint-bg)',
                  cursor: 'pointer'
                }}
              >
                {Object.entries(INDIAN_AGRI_CITIES).map(([key, city]) => (
                  <option key={key} value={key}>
                    {city.name} — {city.region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-location-crosshairs" style={{ color: 'var(--primary-green)', marginRight: '0.3rem' }}></i>
              Lat: {cityInfo.lat}°N, Lon: {cityInfo.lon}°E
            </span>
            <span
              className="section-badge"
              style={{
                backgroundColor: weatherData?.is_live ? 'var(--mint-subtle)' : '#fef3c7',
                color: weatherData?.is_live ? 'var(--primary-green)' : 'var(--amber-warm)',
                fontSize: '0.75rem'
              }}
            >
              <i className={`fa-solid ${weatherData?.is_live ? 'fa-satellite-dish' : 'fa-clock-rotate-left'}`}></i>
              {weatherData?.is_live ? ` ${t('weather_live')}` : ` ${t('weather_model')}`}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 'var(--radius-lg)' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--primary-green)', marginBottom: '1rem' }}></i>
          <p style={{ color: 'var(--text-muted)' }}>{t('weather_loading')} {cityInfo.name}...</p>
        </div>
      ) : weatherData ? (
        <>
          {/* CURRENT WEATHER HERO CARD */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--forest-deep) 0%, var(--forest-dark) 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: 'clamp(1.25rem, 3vw, 2.25rem)',
              color: '#fff',
              marginBottom: '2rem',
              boxShadow: 'var(--shadow-lg)',
              boxSizing: 'border-box',
              width: '100%'
            }}
          >
            <div className="weather-main-display" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <span className="hero-tag" style={{ background: 'rgba(255,255,255,0.12)', color: '#86efac', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '0.75rem' }}>
                  <i className="fa-solid fa-location-dot"></i> {cityInfo.name}
                </span>
                <div className="weather-temp-huge" style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', fontWeight: 800, lineHeight: 1 }}>{weatherData.temp}°C</span>
                  <span style={{ fontSize: '1.15rem', color: '#86efac', fontWeight: 600 }}>{weatherData.condition}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#d1fae5', margin: 0 }}>
                  Agro-Climatic Zone: <strong>{cityInfo.region}</strong>
                </p>
              </div>

              {/* Weather Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: 'clamp(0.85rem, 2vw, 1.25rem)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ textAlign: 'center' }}>
                  <i className="fa-solid fa-droplet" style={{ fontSize: '1.35rem', color: '#67e8f9', marginBottom: '0.35rem' }}></i>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{weatherData.humidity}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{t('weather_humidity')}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <i className="fa-solid fa-wind" style={{ fontSize: '1.35rem', color: '#a7f3d0', marginBottom: '0.35rem' }}></i>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{weatherData.wind} km/h</div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{t('weather_wind')}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <i className="fa-solid fa-cloud-showers-heavy" style={{ fontSize: '1.35rem', color: '#fef08a', marginBottom: '0.35rem' }}></i>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{weatherData.rain_prob}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{t('weather_rain_risk')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5-DAY AGRI FORECAST */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-calendar-days" style={{ color: 'var(--primary-green)' }}></i>
              {t('weather_outlook_title')}
            </h3>

            <div className="forecast-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {weatherData.forecast.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#fff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    padding: '1.25rem',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.5rem' }}>
                    {day.day}
                  </div>
                  <div style={{ fontSize: '2rem', color: 'var(--amber-warm)', marginBottom: '0.5rem' }}>
                    <i className={`fa-solid ${day.icon}`}></i>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem', minHeight: '36px' }}>
                    {day.condition}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {day.max_temp}° / <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{day.min_temp}°</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                    <i className="fa-solid fa-droplet"></i> {day.rain_prob}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TAILORED AGRO-METEOROLOGICAL ADVISORIES */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-bell" style={{ color: 'var(--amber-warm)' }}></i>
              {t('weather_advisories_title')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {weatherData.tips.map((tip, idx) => {
                let bg = 'var(--mint-bg)';
                let border = 'var(--border-green)';
                let iconColor = 'var(--primary-green)';

                if (tip.type === 'warning') {
                  bg = '#fffbeb';
                  border = '#fde68a';
                  iconColor = 'var(--amber-warm)';
                } else if (tip.type === 'danger') {
                  bg = '#fee2e2';
                  border = '#fca5a5';
                  iconColor = '#dc2626';
                } else if (tip.type === 'info') {
                  bg = '#e0f2fe';
                  border = '#bae6fd';
                  iconColor = '#0284c7';
                }

                return (
                  <div
                    key={idx}
                    className="agri-tip-card"
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', color: iconColor, marginTop: '0.2rem' }}>
                      <i className={`fa-solid ${tip.icon}`}></i>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.25rem' }}>
                        {tip.title}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                        {tip.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
