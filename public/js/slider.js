// 轮播图脚本
document.addEventListener('DOMContentLoaded', function() {
  // 获取轮播图元素
  const sliderContainer = document.querySelector('.slider-container');
  if (!sliderContainer) return;
  
  const slides = sliderContainer.querySelectorAll('.slide');
  if (slides.length <= 1) return;
  
  const prevBtn = document.querySelector('.slider-control.prev');
  const nextBtn = document.querySelector('.slider-control.next');
  const dots = document.querySelectorAll('.slider-dot');
  
  let currentIndex = 0;
  const slideCount = slides.length;
  
  // 切换到指定幻灯片
  function goToSlide(index) {
    if (index < 0) {
      index = slideCount - 1;
    } else if (index >= slideCount) {
      index = 0;
    }
    
    currentIndex = index;
    sliderContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // 更新小圆点状态
    dots.forEach((dot, i) => {
      if (i === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }
  
  // 绑定按钮事件
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToSlide(currentIndex - 1);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToSlide(currentIndex + 1);
    });
  }
  
  // 绑定小圆点事件
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goToSlide(i);
    });
  });
  
  // 自动轮播
  let interval = setInterval(() => {
    goToSlide(currentIndex + 1);
  }, 5000);
  
  // 鼠标悬停时暂停自动轮播
  const slider = document.querySelector('.featured-slider');
  if (slider) {
    slider.addEventListener('mouseenter', () => {
      clearInterval(interval);
    });
    
    slider.addEventListener('mouseleave', () => {
      interval = setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 5000);
    });
  }
  
  // 触摸事件支持
  let touchStartX = 0;
  let touchEndX = 0;
  
  sliderContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    clearInterval(interval);
  }, { passive: true });
  
  sliderContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    
    interval = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5000);
  }, { passive: true });
  
  function handleSwipe() {
    const difference = touchStartX - touchEndX;
    if (difference > 50) {
      // 向左滑动
      goToSlide(currentIndex + 1);
    } else if (difference < -50) {
      // 向右滑动
      goToSlide(currentIndex - 1);
    }
  }
});
