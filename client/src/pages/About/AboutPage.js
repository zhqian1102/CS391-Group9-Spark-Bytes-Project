// AboutPage.js
import React from 'react';
import './AboutPage.css';
import NavigationBar from '../../components/NavigationBar';
import Footer from '../../components/Footer';

const AboutPage = () => {
  return (
    <div className="about-page">
      <NavigationBar />
      
      <main className="about-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-overlay">
            <div className="hero-text">
              <h1 className="hero-title">About Spark!Bytes</h1>
              <p className="hero-subtitle">
                Connecting the Boston University community through food, one event at a time
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="container">
            <h2 className="section-title">Our Mission</h2>
            <p className="mission-text">
            Spark!Bytes is a student-driven platform dedicated to reducing food waste and strengthening community connections at Boston University. We believe that no food should go to waste when there are students who could benefit from it. By making it simple for students, faculty, and organizations to share surplus food from campus events, Spark!Bytes helps build a more sustainable, inclusive, and connected BU community.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <div className="container">
            <h2 className="section-title">How It Works</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-icon">📅</div>
                <h3 className="step-title">Post an Event</h3>
                <p className="step-description">
                  Have leftover food from a meeting, event, or gathering? Post it on Spark!Bytes 
                  with location details and food information.
                </p>
              </div>
              
              <div className="step-card">
                <div className="step-icon">📢</div>
                <h3 className="step-title">Get Notified</h3>
                <p className="step-description">
                  Students receive instant notifications about free food available across campus, 
                  so they never miss an opportunity.
                </p>
              </div>
              
              <div className="step-card">
                <div className="step-icon">🍕</div>
                <h3 className="step-title">Reserve & Enjoy</h3>
                <p className="step-description">
                  Browse available food, reserve your portion, and head to the location to pick up 
                  your meal. It's that simple!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Spark!Bytes Section */}
        <section className="why-section">
          <div className="container">
            <h2 className="section-title">Why Spark!Bytes?</h2>
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">🌱</div>
                <h3 className="benefit-title">Sustainability</h3>
                <p className="benefit-description">
                  Reduce food waste on campus and contribute to a more sustainable environment. 
                  Every meal saved is a step toward a greener BU.
                </p>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">🤝</div>
                <h3 className="benefit-title">Community Building</h3>
                <p className="benefit-description">
                  Connect with fellow Terriers through shared meals. Food brings people together 
                  and strengthens our campus community.
                </p>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">💰</div>
                <h3 className="benefit-title">Save Money</h3>
                <p className="benefit-description">
                  Access free, quality food from campus events. Perfect for students on a budget 
                  looking for their next meal.
                </p>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">⚡</div>
                <h3 className="benefit-title">Real-Time Updates</h3>
                <p className="benefit-description">
                  Get instant notifications when food becomes available near you. Never miss out 
                  on free food opportunities again.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">🎯</div>
                <h3 className="benefit-title">Easy to Use</h3>
                <p className="benefit-description">
                  Simple, intuitive interface designed for busy students. Find or post food in just a few clicks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <div className="container">
            <h2 className="section-title">About the Developers</h2>
            <p className="team-intro">
              Spark!Bytes was created by a team of BU Computer Science students passionate about 
              sustainability and community. We built this platform to address the real problem of 
              food waste on campus while helping fellow students discover free meals.
            </p>
            <div className="team-values">
              <div className="value-card">
                <div className="value-icon">💻</div>
                <h3 className="value-title">Built by Students</h3>
                <p className="value-description">
                  Created by Team 9 - a group of CS students who wanted to solve a real problem we all face on campus
                </p>
              </div>
              
              <div className="value-card">
                <div className="value-icon">🎓</div>
                <h3 className="value-title">For Students</h3>
                <p className="value-description">
                  Designed with the BU student experience in mind, making campus life a little easier
                </p>
              </div>
              
              <div className="value-card">
                <div className="value-icon">🚀</div>
                <h3 className="value-title">Open Source</h3>
                <p className="value-description">
                  Built with modern web technologies and continuously improving with community feedback
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-text">
              Whether you're looking for your next meal or have food to share, Spark!Bytes connects the BU community
            </p>
            <div className="cta-buttons">
              <a href="/events" className="cta-button primary">
                Find Free Food
              </a>
            </div>
            <p className="cta-subtext">
              Event organizers: Have leftover food? <a href="/post" className="cta-link">Post an event</a>
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <div className="container">
            <h2 className="section-title">Get in Touch</h2>
            <p className="contact-text">
              Have questions, feedback, or want to get involved? We'd love to hear from you!
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span className="contact-detail">buspark@bu.edu</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span className="contact-detail">Boston University, Boston, MA</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;