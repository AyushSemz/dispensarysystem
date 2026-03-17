import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import './CardSwap.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, ...rest }, ref) => (
  <div ref={ref} {...rest} className={`card ${customClass ?? ''} ${rest.className ?? ''}`.trim()} />
));
Card.displayName = 'Card';

interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

interface CardSwapProps {
  width?: number;
  height?: number;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (index: number) => void;
  skewAmount?: number;
  easing?: 'elastic' | 'smooth';
  scrollEnabled?: boolean;
  scrollThreshold?: number;
  children: React.ReactNode;
}

const CardSwap = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  scrollEnabled = false,
  scrollThreshold = 100,
  children
}: CardSwapProps) => {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef<HTMLDivElement>()),
    [childArr.length]
  );

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number>();
  const container = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollAccumulator = useRef(0);
  const isAnimating = useRef(false);
  const currentCardIndex = useRef(0);
  const isInSection = useRef(false);
  const hasCompletedCycle = useRef(false);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
      }
    });

    const swap = () => {
      if (order.current.length < 2 || isAnimating.current) return;
      isAnimating.current = true;

      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      if (!elFront) {
        isAnimating.current = false;
        return;
      }

      currentCardIndex.current++;

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
          // Check if we've shown all cards
          if (currentCardIndex.current >= childArr.length) {
            hasCompletedCycle.current = true;
          }
        }
      });
      tlRef.current = tl;

      tl.to(elFront, {
        y: '+=500',
        duration: config.durDrop,
        ease: config.ease
      });

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease
          },
          `promote+=${i * 0.15}`
        );
      });

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      tl.call(
        () => {
          gsap.set(elFront, { zIndex: backSlot.zIndex });
        },
        undefined,
        'return'
      );
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease
        },
        'return'
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    if (scrollEnabled) {
      const handleScroll = (e: Event) => {
        const node = container.current;
        if (!node) return;

        const rect = node.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Check if section is in viewport
        const sectionTop = rect.top;
        const sectionBottom = rect.bottom;
        
        isInSection.current = sectionTop < windowHeight && sectionBottom > 0;

        // If we're in the section and haven't completed the cycle
        if (isInSection.current && !hasCompletedCycle.current) {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY.current;

          // Prevent default scrolling behavior
          if (delta > 0 && currentCardIndex.current < childArr.length) {
            e.preventDefault();
            window.scrollTo(0, lastScrollY.current);
            
            scrollAccumulator.current += Math.abs(delta);
            
            if (scrollAccumulator.current >= scrollThreshold && !isAnimating.current) {
              scrollAccumulator.current = 0;
              swap();
            }
          }
        } else if (hasCompletedCycle.current && isInSection.current) {
          // Allow normal scrolling after completing the cycle
          lastScrollY.current = window.scrollY;
        } else {
          lastScrollY.current = window.scrollY;
        }
      };

      const handleWheel = (e: WheelEvent) => {
        const node = container.current;
        if (!node) return;

        const rect = node.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        isInSection.current = rect.top < windowHeight && rect.bottom > 0;

        if (isInSection.current && !hasCompletedCycle.current && currentCardIndex.current < childArr.length) {
          if (e.deltaY > 0) {
            e.preventDefault();
            
            scrollAccumulator.current += Math.abs(e.deltaY);
            
            if (scrollAccumulator.current >= scrollThreshold && !isAnimating.current) {
              scrollAccumulator.current = 0;
              swap();
            }
          }
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: false });
      window.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('wheel', handleWheel);
      };
    } else {
      // Time-based swapping
      swap();
      intervalRef.current = window.setInterval(swap, delay);

      if (pauseOnHover) {
        const node = container.current;
        if (!node) return;
        const pause = () => {
          tlRef.current?.pause();
          clearInterval(intervalRef.current);
        };
        const resume = () => {
          tlRef.current?.play();
          intervalRef.current = window.setInterval(swap, delay);
        };
        node.addEventListener('mouseenter', pause);
        node.addEventListener('mouseleave', resume);
        return () => {
          node.removeEventListener('mouseenter', pause);
          node.removeEventListener('mouseleave', resume);
          clearInterval(intervalRef.current);
        };
      }
      return () => clearInterval(intervalRef.current);
    }
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, scrollEnabled, scrollThreshold, refs, config, childArr.length]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child as React.ReactElement<any>, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: (e: React.MouseEvent) => {
            child.props.onClick?.(e);
            onCardClick?.(i);
          }
        })
      : child
  );

  return (
    <div ref={container} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
};

export default CardSwap;
