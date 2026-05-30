import "../styles/Home.css";
import heroImg from "../images/hero.png";
import bannerImg from "../images/banner.png";



const Home = () => {
  return (
    <>
      {/* HERO SECTION */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Bridging Communication <br />
              Between Sign Language and <br />
              the World
            </h1>
            <p>
              Instantly translate sign language gestures into text and
              speech with AI-powered recognition.
            </p>

            <div className="hero-buttons">
              <a href="/translator" className="btn-primary">
                Try Live Translator
              </a>
              <a href="#how-it-works" className="btn-secondary">
                Learn More
              </a>
            </div>
          </div>

          <div className="hero-image">
            <img src={heroImg} alt="Sign language illustration" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="how-it-works">
        <h2>How It Works</h2>

        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon">📷</div>
            <p>
              <strong>Enable Camera</strong> – Allow your camera to
              detect hand gestures.
            </p>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon">✋</div>
            <p>
              <strong>Make a Sign</strong> – Show a clear sign in front
              of the camera.
            </p>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon">🔊</div>
            <p>
              <strong>Get Translation</strong> – Receive instant text
              and speech output.
            </p>
          </div>
        </div>
      </section>

      {/* IMAGE + TEXT SECTION */}
      <section className="image-text-banner">
        <div className="banner-image">
          <img src={bannerImg} alt="Communication illustration" />
        </div>

        <div className="banner-text">
          <h3>Breaking Barriers with Technology</h3>
          <p>
            Our platform connects the world by translating sign
            language gestures into spoken words and written text,
            making communication seamless for everyone.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2>Why Choose Us?</h2>

        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon">✋</div>
            <h3>Real-time Recognition</h3>
            <p>AI detects signs instantly with low latency.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔊</div>
            <h3>Text + Speech Output</h3>
            <p>Get both visual and audio translation.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Free & Easy</h3>
            <p>No signup required. Start instantly.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-links">
          <a href="/">Home</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#">Privacy Policy</a>
        </div>

        <p>© 2025 Sign Language Translator</p>
      </footer>
    </>
  );
};

export default Home;
