import Image from 'next/image';
import heroImg from './images/computer.jpg';
import geometryImg from './images/geometry.jpg';
import filamentImg from './images/cells.jpg';
import pianoImg from './images/piano.jpg';
import kaleidoscopeImg from './images/kaleidoscope.jpg';

export default function Home() {
  return (
    <main>
      <header className="uni-hero dark">
        <Image src={heroImg} alt="" />
        <div className="heading">
          <h1>Obelisk: Beyond Silicon</h1>
          <p>
            In a landmark announcement, researchers from the Interplanetary
            Technological Archaeology Division (ITAD) have revealed the first
            in-depth analysis of an extraterrestrial computing device
          </p>
        </div>
        <div className="caption">
          <p>
            Note: content is totally fictional and made with help of
            text-generation tools.
          </p>
          <p>
            Photo by{' '}
            <a href="https://unsplash.com/@wizzyfx?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
              Ugi K.
            </a>{' '}
            on{' '}
            <a href="https://unsplash.com/photos/black-and-white-ip-desk-phone-on-brown-wooden-desk-anaUCgS2fqE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
              Unsplash
            </a>
          </p>
        </div>
      </header>
      <section>
        <header>
          <h2>Architectural Features</h2>
          <p>
            The Obelisk is a marvel of alien engineering, and its architecture
            blends design, function, and mystery in equal measure
          </p>
        </header>
        <div className="small-feature-grid">
          <div>
            <h3>Crystalline Core Matrix</h3>
            <div>
              At the center of the Obelisk is a crystalline core made of an
              unknown hexagonal-lattice compound. This structure pulses with
              organized waves of light, believed to encode complex data far
              beyond binary. The core’s geometry subtly shifts in response to
              mental or environmental stimuli, suggesting a reactive form of
              computation.
            </div>
          </div>
          <div>
            <h3>Organic Filament Network</h3>
            <Image
              src={filamentImg}
              alt="Microscope view of the Organic Filament Network"
            />
            <div>
              <p>
                Threaded through the interior is a network of glowing filaments,
                resembling neural tissue. These bioluminescent strands react to
                nearby thoughts and emotions. Some scientists believe they adapt
                over time, forming a bridge between machine processing and
                living memory.
              </p>
              <p>
                Photo by{' '}
                <a href="https://unsplash.com/es/@nci?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
                  National Cancer Institute
                </a>{' '}
                in{' '}
                <a href="https://unsplash.com/es/fotos/textil-floral-negro-rosa-y-azul-c-wqrSCjVf4?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
                  Unsplash
                </a>
              </p>
            </div>
          </div>
          <div>
            <h3>Self configuring Geometry</h3>
            <Image src={geometryImg} alt="" />
            <div>
              <p>
                Though it appears monolithic, the Obelisk subtly rearranges
                itself on a microscopic level. These internal shifts seem to
                serve a purpose—possibly optimizing its function based on who or
                what is near. Observers report the uncanny sense that it changes
                for them.
              </p>
              <p>
                Photo by{' '}
                <a href="https://unsplash.com/@marg_cs?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
                  Margarida CSilva
                </a>{' '}
                on{' '}
                <a href="https://unsplash.com/photos/minimalist-photography-of-gray-wall-with-grill-shadows-eM9b0FGIeno?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
                  Unsplash
                </a>
              </p>
            </div>
          </div>
          <div>
            <h3>Cognitive Resonance Field Projectors</h3>
            <div>
              The Obelisk emits low-frequency electromagnetic fields that
              interact with human brainwaves. Users with high theta activity can
              sense patterns, sounds, or even visions. It's not touched or typed
              into—it’s felt, like it reaches into your thoughts and listens.
            </div>
          </div>
          <div>
            <h3>Lack of Conventional Interfaces</h3>
            <div>
              There are no buttons, ports, or screens on the device. It doesn’t
              accept physical input in any known way. Instead, interaction
              appears to occur through mental resonance, as if it understands
              intention directly from brainwave harmonics.
            </div>
          </div>
          <div>
            <h3>Ambient Data Halo</h3>
            <div>
              Sometimes, a halo of glowing symbols appears around the
              Obelisk—shifting, floating, and reacting to nearby presence. These
              glyphs often take forms familiar to the observer, suggesting the
              device visualizes data in a deeply personal, even psychological
              way.
            </div>
          </div>
          <div>
            <h3>Self-Sustaining Power Source</h3>
            <div>
              The Obelisk operates without wires or known energy inputs. It
              emits a steady field, hinting at a zero-point or dark energy power
              source. Devices nearby often glitch, leading researchers to
              believe it draws from—or distorts—the surrounding quantum field.
            </div>
          </div>
          <div>
            <h3>Fading Surface Glyphs</h3>
            <div>
              When first discovered, the Obelisk was covered in etched
              symbols—like alien circuitry or star maps. Over time, many of
              these have faded or vanished. Some believe they were temporary
              keys, unlocking the device’s dormant systems as it “woke up.”
            </div>
          </div>
        </div>

        <div className="video-feature">
          <div className="video">
            <a href="">
              <Image src={kaleidoscopeImg} alt="" />
              <span>▶︎</span>
              <p>Discover more about the Obelisk 67-state system</p>
            </a>
          </div>
          <div>
            <h3>67 distinct color-state transitions</h3>
            <p>
              Professor Elira Vonn, theoretical computation specialist from the
              Aeskar Institute of Multidimensional Logic talks about when she
              noticed a recurring pattern of 67 distinct color-state transitions
              within the Obelisk’s crystalline core—each corresponding to a
              unique data harmonic
            </p>
            <p>
              Photo by{' '}
              <a href="https://unsplash.com/@christianliebel?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
                Christian Liebel
              </a>{' '}
              on{' '}
              <a href="https://unsplash.com/photos/a-star-in-the-middle-of-a-blue-and-yellow-background-zGGfj7PpyCQ?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
                Unsplash
              </a>
            </p>
          </div>
        </div>
      </section>

      <section>
        <header>
          <h2>Innovations sparked by the Obelisk</h2>
          <p>
            Here’s a list of article headlines exploring the ripple effects and
            innovations sparked by the Obelisk’s discovery
          </p>
        </header>

        <div className="uni-link-list">
          <div className="large-links">
            <a href="">
              <Image src={pianoImg} alt="" />
              <h3>
                Harnessing 67-state quantum harmonics to transcend binary
                computation.
              </h3>
              <p>
                How the Obelisk’s 67-state logic shattered binary thinking and
                opened the gates to a new era of consciousness-driven machines
              </p>
            </a>
            <p>
              Photo by{' '}
              <a href="https://unsplash.com/@possessedphotography?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
                Possessed Photography
              </a>{' '}
              on{' '}
              <a href="https://unsplash.com/photos/robot-playing-piano-U3sOwViXhkY?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
                Unsplash
              </a>
            </p>
          </div>

          <div className="small-links">
            <div>
              <a href="">
                <p className="link-tag">Zero-Point Power</p>
                <p className="link-text">
                  Tapping the Obelisk’s Infinite Energy Well
                </p>
              </a>
            </div>
            <div>
              <a href="">
                <p className="link-tag">Emotion-Driven Systems</p>
                <p className="link-text">
                  The First Human-Responsive AI Networks
                </p>
              </a>
            </div>
            <div>
              <a href="">
                <p className="link-tag">Redefining Interface</p>
                <p className="link-text">
                  Why Future Machines Won’t Need Screens or Keyboards
                </p>
              </a>
            </div>
            <div>
              <a href="">
                <p className="link-tag">The Theta Link</p>
                <p className="link-text">
                  Training Human Minds to Speak to Alien Tech
                </p>
              </a>
            </div>
            <div>
              <a href="">
                <p className="link-tag">The Conscious Circuit</p>
                <p className="link-text">
                  Can Machines Feel, or Are We Just Projecting?
                </p>
              </a>
            </div>
            <div>
              <a href="">
                <p className="link-tag">Psi-Firewalls</p>
                <p className="link-text">
                  New Security Models for Cognitive Computing
                </p>
              </a>
            </div>
            <div>
              <a href="">
                <p className="link-tag">The Vonn Translation Protocol</p>
                <p className="link-text">Decoding the 67-State Hyperlogic</p>
              </a>
            </div>
            <div>
              <a href="">
                <p className="link-tag">Architects of Thought</p>
                <p className="link-text">
                  Designing Buildings That React Like the Obelisk
                </p>
              </a>
            </div>
            <div>
              <a href="">
                <p className="link-tag">Bio-Adaptive Storage</p>
                <p className="link-text">The Living Hard Drives of Tomorrow</p>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
