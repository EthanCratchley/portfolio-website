function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
  }

  function filterProjects(category) {
    const projects = document.querySelectorAll('.project');
  
    projects.forEach(project => {
      if (category === 'all' || project.dataset.category === category) {
        project.style.display = '';
      } else {
        project.style.display = 'none';
      }
    });
  }