gsap.registerPlugin(ScrollTrigger);

window.odometerOptions = {
  auto: true, // Don't automatically initialize everything with class 'odometer'
  selector: '.odometer', // Change the selector used to automatically find things to be animated
  format: '(ddd)', // Change how digit groups are formatted, and how many digits are shown after the decimal point
  duration: 3000, // Change how long the javascript expects the CSS animation to take
};

window.addEventListener("load", () => {
    const loadingScreen = document.querySelector(".loading-screen")
    loadingScreen.classList.add("done")
})

window.addEventListener("load", () => {
  
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
        autoplay: false,
    })

    // Wrap every letter in a span
    document.querySelectorAll('.ml6 .letters').forEach(textWrapper => {
        textWrapper.innerHTML = textWrapper.textContent.replace(
            /\S/g,
            "<span class='letter'>$&</span>"
        );
    });

        const carousel = document.getElementById("contenu-carousel");
    
    document.querySelector(".contenu-left").addEventListener("click", () => {
        
    carousel.scrollBy({
        left: -400,
        behavior: "smooth"
    });
    });

    document.querySelector(".contenu-right").addEventListener("click", () => {
        
    carousel.scrollBy({
        left: 400,
        behavior: "smooth"
    });
    });

    const leftBtn = document.querySelector(".contenu-left");
    const rightBtn = document.querySelector(".contenu-right");
    let carouselScrollOffset = 70

    function updateButtons() {
        // Début
        leftBtn.classList.toggle("hidden", carousel.scrollLeft <= carouselScrollOffset)

        // Fin
        rightBtn.classList.toggle(
            "hidden",
            carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - carouselScrollOffset
        );
    }

    carousel.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);

    updateButtons();


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
        start: "top 70%",
        end: "bottom center",
        scrub: true
    }
    });

    gsap.utils.toArray(".timeline-item").forEach(item => {

    const direction =
        item.classList.contains("left")
        ? -100
        : 100;

    if (window.scrollWidth > 600) {

        gsap.from(item, {
            x: direction,
            opacity: 0,
            duration: 1,

            scrollTrigger: {
            trigger: item,
            start: "top 70%"
            }
        });

    }

    gsap.utils.toArray(".timeline .card").forEach(card => {

    ScrollTrigger.create({
        trigger: card,
        start: "top center",

        onEnter: () => {
        card.classList.add("timeline-visible")
        gsap.fromTo(card,
            {
            scale: 0.9,
            opacity: 0
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
            card.classList.remove("timeline-visible")
        gsap.to(card, {
            scale: 0.9,
            opacity: 0,
            duration: 0.3
        });
        }
    });

    });

    })

    // Scroll animations

    if (window.innerWidth < 900) {
        document.querySelectorAll(".contenu-carousel-wrapper .card").forEach(card => {
            card.dataset.delay = 100
        })
    }

    const scrollAnimObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add("show")                
                }, entry.target.dataset.delay || 0);
            }
        })
    }, {threshold: 0.8})

    const scrollAnimEls = document.querySelectorAll(".scrollAnimate")
    scrollAnimEls.forEach(element => {
        scrollAnimObs.observe(element)
    })

    document.querySelectorAll(".open-popup").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.getElementById(btn.dataset.target).classList.add("on")
            e.stopPropagation()
            

            document.addEventListener("click", () => {
                document.querySelectorAll(".popup.on").forEach(popup => {
                    popup.classList.remove("on")
                    
                })
            },{once: true} )            
        })
    })

    // FAQ accordion

    document.querySelectorAll(".faq-item").forEach(item => {

        item.addEventListener("click", () => {
            const alreadyOpen = item.classList.contains("open");

            document.querySelectorAll(".faq-item.open").forEach(openItem => {
                if (openItem !== item) openItem.classList.remove("open");
            });

            item.classList.toggle("open", !alreadyOpen);
        });
    });


})

// Spakle effect 

document.addEventListener("click", e => {
    const burst = document.createElement("div");
    burst.className = "click-burst";

    burst.style.left = e.clientX + "px";
    burst.style.top = e.clientY + "px";

    const rays = 8;

    for (let i = 0; i < rays; i++) {
        const ray = document.createElement("span");
        ray.style.setProperty("--angle", `${i * (360 / rays)}deg`);
        burst.appendChild(ray);
    }

    document.body.appendChild(burst);

    setTimeout(() => burst.remove(), 450);
});