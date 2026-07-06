gsap.registerPlugin(ScrollTrigger);

window.odometerOptions = {
  auto: true, // Don't automatically initialize everything with class 'odometer'
  selector: '.odometer', // Change the selector used to automatically find things to be animated
  format: '(ddd)', // Change how digit groups are formatted, and how many digits are shown after the decimal point
  duration: 3000, // Change how long the javascript expects the CSS animation to take
};

document.addEventListener("DOMContentLoaded", () => {
    // Number effect

    const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.innerHTML = entry.target.dataset.number;
            observer.unobserve(entry.target);
        }
    });
    });

    document.querySelectorAll(".number-animate").forEach(stat => {
        observer.observe(stat);
    });

    const heroTw = createTypewriter(document.getElementById("heroTypewriter"), {
        texts: ["même si tu débutes", "même si tu n'as pas beaucoup de budget", "même si tu n'as pas encore de clients", "même si tu as peu de temps"],
        highlights: ["débutes", "budget", "clients", "temps"],
        highlightColor: "--accent",
        highlightClass: "accent",
        pauseAfterType: 600,
        typeSpeed: 50,
    })

    // VSL player

    const vslPlayer = createVideoPlayer(document.getElementById("vsl"), {
        src: "https://youtu.be/PO-BS5-K4io?si=LlylM41QvZhSawks",
        autoplay: true,
    })

    // Wrap every letter in a span
    document.querySelectorAll('.ml6 .letters').forEach(textWrapper => {
        textWrapper.innerHTML = textWrapper.textContent.replace(
            /\S/g,
            "<span class='letter'>$&</span>"
        );
    });



    const textObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                anime.timeline({loop: false})
                .add({
                    targets: entry.target.querySelectorAll(".letter"),
                    translateY: ["1.1em", 0],
                    opacity: 1,
                    translateZ: 0,
                    duration: 750,
                    delay: (el, i) => 50 * i
                })                    
            } else {
                anime.timeline({loop: false})
                .add ({
                    targets: entry.target.querySelectorAll(".letter"),
                    opacity: 0,
                    duration: 750,
                    delay: (el, i) => 50 * i
                })
            }
        
        })
    }, {
        threshold: 0,
        rootMargin: "-50px 0px -100px 0px"
    })

    const animatedText = document.querySelectorAll(".ml6")

    animatedText.forEach(el => {
        textObserver.observe(el)
    })

    // Timeline
    
    gsap.from(".timeline-line", {
    scaleY: 0,
    ease: "none",

    scrollTrigger: {
        trigger: ".timeline",
        start: "top 60%",
        end: "bottom center",
        scrub: true
    }
    });

    gsap.utils.toArray(".timeline-item").forEach(item => {

    const direction =
        item.classList.contains("left")
        ? -100
        : 100;

    gsap.from(item, {
        x: direction,
        opacity: 0,
        duration: 1,

        scrollTrigger: {
        trigger: item,
        start: "top 60%"
        }
    });

    gsap.utils.toArray(".card").forEach(card => {

    ScrollTrigger.create({
        trigger: card,
        start: "top center",

        onEnter: () => {
        gsap.fromTo(card,
            {
            scale: 0.9,
            opacity: 0.4
            },
            {
            scale: 1.05,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
            }
        );
        },

        onLeaveBack: () => {
        gsap.to(card, {
            scale: 0.9,
            opacity: 0.4,
            duration: 0.3
        });
        }
    });

    });
    gsap.fromTo(dot,
    { scale: 1 },
    {
        scale: 2,
        duration: 0.3,
        yoyo: true,
        repeat: 1
    }
    );

    });
})    