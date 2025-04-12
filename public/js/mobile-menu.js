// 移动端菜单脚本
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      
      // 切换菜单图标
      const menuIcon = mobileMenuToggle.querySelector('svg');
      if (menuIcon) {
        if (mobileMenu.classList.contains('active')) {
          menuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />';
        } else {
          menuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />';
        }
      }
    });
  }
  
  // 移动端下拉菜单
  const dropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const dropdown = toggle.nextElementSibling;
      if (dropdown) {
        dropdown.classList.toggle('active');
        
        // 切换箭头方向
        const icon = toggle.querySelector('.mobile-dropdown-icon');
        if (icon) {
          if (dropdown.classList.contains('active')) {
            icon.classList.add('rotate-180');
          } else {
            icon.classList.remove('rotate-180');
          }
        }
      }
    });
  });
});
