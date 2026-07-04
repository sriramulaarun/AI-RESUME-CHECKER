// Frontend Controller for TalentAI Resume Parser

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let state = {
        candidates: [],
        activeSkillsFilters: new Set(),
        allSkillsList: [],
        currentCandidateId: null
    };

    // DOM Elements Cache
    const elements = {
        // Stats
        statTotalCandidates: document.getElementById('stat-total-candidates'),
        statAvgSkills: document.getElementById('stat-avg-skills'),
        statUniqueSkills: document.getElementById('stat-unique-skills'),
        
        // Upload & Skills
        dropZone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-input'),
        browseBtn: document.getElementById('browse-btn'),
        uploadQueue: document.getElementById('upload-queue'),
        topSkillsCloud: document.getElementById('top-skills-cloud'),
        
        // Search & Filter
        searchInput: document.getElementById('search-input'),
        activeFiltersContainer: document.getElementById('active-filters'),
        candidatesList: document.getElementById('candidates-list'),
        
        // Drawer
        drawer: document.getElementById('candidate-drawer'),
        drawerOverlay: document.getElementById('drawer-overlay'),
        closeDrawerBtn: document.getElementById('close-drawer-btn'),
        drawerName: document.getElementById('drawer-name'),
        drawerFilename: document.getElementById('drawer-filename'),
        drawerEmail: document.getElementById('drawer-email'),
        drawerPhone: document.getElementById('drawer-phone'),
        drawerEducation: document.getElementById('drawer-education'),
        drawerSkills: document.getElementById('drawer-skills'),
        drawerRawText: document.getElementById('drawer-raw-text'),
        drawerDownloadBtn: document.getElementById('drawer-download-btn'),
        drawerDeleteBtn: document.getElementById('drawer-delete-btn'),
        
        // Navigation Views
        navDashboard: document.getElementById('nav-dashboard'),
        navResumes: document.getElementById('nav-resumes'),
        dashboardView: document.getElementById('dashboard-view'),
        searchListPanel: document.querySelector('.search-list-panel')
    };

    /* ==========================================================================
       1. Initialization & Navigation
       ========================================================================== */
    async function init() {
        setupEventListeners();
        await refreshData();
    }

    // Refresh candidate list and calculate UI metrics
    async function refreshData() {
        showSkeletonLoader();
        await loadCandidates();
        calculateAndRenderStats();
        renderSkillsCloud();
    }

    // Tab Navigation setup
    elements.navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveTab(elements.navDashboard, 'dashboard');
    });

    elements.navResumes.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveTab(elements.navResumes, 'resumes');
    });

    function setActiveTab(activeTabEl, viewMode) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        activeTabEl.classList.add('active');
        
        if (viewMode === 'dashboard') {
            elements.dashboardView.style.display = 'block';
            elements.searchListPanel.style.marginTop = '10px';
        } else {
            elements.dashboardView.style.display = 'none';
            elements.searchListPanel.style.marginTop = '0px';
        }
    }

    /* ==========================================================================
       2. AJAX Requests & Data Loading
       ========================================================================== */
    async function loadCandidates() {
        const query = elements.searchInput.value.trim();
        const skills = Array.from(state.activeSkillsFilters).join(',');
        
        let url = `/api/candidates?query=${encodeURIComponent(query)}`;
        if (skills) {
            url += `&skills=${encodeURIComponent(skills)}`;
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load candidates');
            state.candidates = await response.json();
            renderCandidatesList();
        } catch (err) {
            console.error('Error fetching candidates:', err);
            elements.candidatesList.innerHTML = `
                <div class="no-candidates">
                    <i class="fa-solid fa-circle-exclamation" style="color: var(--color-danger)"></i>
                    <span>Could not connect to database server. Please check config.</span>
                </div>
            `;
        }
    }

    /* ==========================================================================
       3. Dynamic Rendering Components
       ========================================================================== */
    // Renders the candidate details list
    function renderCandidatesList() {
        if (state.candidates.length === 0) {
            elements.candidatesList.innerHTML = `
                <div class="no-candidates">
                    <i class="fa-solid fa-folder-open"></i>
                    <span>No candidates match the filter criteria.</span>
                </div>
            `;
            return;
        }

        elements.candidatesList.innerHTML = '';
        state.candidates.forEach(cand => {
            const row = document.createElement('div');
            row.className = 'candidate-row';
            row.setAttribute('data-id', cand.id);
            
            // Generate initials
            const initials = cand.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
            
            // Skill tags html limit to first 5
            const skillsHtml = cand.skills.slice(0, 5).map(skill => 
                `<span class="cand-skill-badge">${escapeHTML(skill)}</span>`
            ).join('');
            
            const skillsOverflow = cand.skills.length > 5 ? `<span class="cand-skill-badge" style="background: rgba(255,255,255,0.05); color: var(--text-secondary)">+${cand.skills.length - 5}</span>` : '';

            row.innerHTML = `
                <div class="col-name">
                    <div class="cand-name-wrapper">
                        <div class="cand-initials">${initials}</div>
                        <div class="cand-meta">
                            <span class="cand-name">${escapeHTML(cand.name)}</span>
                            <span class="cand-filename" title="${escapeHTML(cand.filename)}">${escapeHTML(cand.filename)}</span>
                        </div>
                    </div>
                </div>
                <div class="col-contact">
                    <div class="cand-contact-info">
                        ${cand.email ? `<span><i class="fa-regular fa-envelope"></i> ${escapeHTML(cand.email)}</span>` : ''}
                        ${cand.phone ? `<span><i class="fa-solid fa-phone-flip"></i> ${escapeHTML(cand.phone)}</span>` : ''}
                        ${!cand.email && !cand.phone ? `<span style="color: var(--text-muted)">No contact info</span>` : ''}
                    </div>
                </div>
                <div class="col-education">
                    <span class="cand-edu-summary" title="${escapeHTML(cand.education)}">${escapeHTML(cand.education)}</span>
                </div>
                <div class="col-skills">
                    <div class="cand-skills-tags">
                        ${skillsHtml}
                        ${skillsOverflow}
                        ${cand.skills.length === 0 ? '<span style="color: var(--text-muted); font-size: 11px">No skills detected</span>' : ''}
                    </div>
                </div>
                <div class="col-actions">
                    <button class="btn-icon btn-view" title="View Profile"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn-icon btn-icon-danger btn-delete" title="Delete Profile"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            
            // Add click row to open detail drawer (excluding actions column)
            row.addEventListener('click', (e) => {
                if (!e.target.closest('.col-actions')) {
                    openCandidateDrawer(cand.id);
                }
            });
            
            // Add delete event
            row.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete profile for ${cand.name}?`)) {
                    deleteCandidate(cand.id);
                }
            });

            // Add view event
            row.querySelector('.btn-view').addEventListener('click', (e) => {
                e.stopPropagation();
                openCandidateDrawer(cand.id);
            });

            elements.candidatesList.appendChild(row);
        });
    }

    // Calculates and displays metrics
    function calculateAndRenderStats() {
        const total = state.candidates.length;
        elements.statTotalCandidates.textContent = total;
        
        let avgSkills = 0;
        let uniqueSkills = new Set();
        
        if (total > 0) {
            let totalSkillsCount = 0;
            state.candidates.forEach(c => {
                totalSkillsCount += c.skills.length;
                c.skills.forEach(s => uniqueSkills.add(s));
            });
            avgSkills = (totalSkillsCount / total).toFixed(1);
        }
        
        elements.statAvgSkills.textContent = avgSkills;
        elements.statUniqueSkills.textContent = uniqueSkills.size;
    }

    // Renders the cloud tags based on skill counts
    function renderSkillsCloud() {
        if (state.candidates.length === 0) {
            elements.topSkillsCloud.innerHTML = '<span class="no-skills-msg">Upload resumes to discover skills.</span>';
            return;
        }

        // Count skills occurrences
        let skillCounts = {};
        state.candidates.forEach(cand => {
            cand.skills.forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });

        // Convert to sorted array
        const sortedSkills = Object.keys(skillCounts)
            .map(skill => ({ name: skill, count: skillCounts[skill] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15); // Show top 15

        if (sortedSkills.length === 0) {
            elements.topSkillsCloud.innerHTML = '<span class="no-skills-msg">No skills identified.</span>';
            return;
        }

        elements.topSkillsCloud.innerHTML = '';
        sortedSkills.forEach(item => {
            const tag = document.createElement('span');
            const isActive = state.activeSkillsFilters.has(item.name);
            tag.className = `skill-tag ${isActive ? 'active' : ''}`;
            tag.innerHTML = `${escapeHTML(item.name)} <span class="skill-count">${item.count}</span>`;
            
            tag.addEventListener('click', () => {
                toggleSkillFilter(item.name);
            });
            
            elements.topSkillsCloud.appendChild(tag);
        });
    }

    function toggleSkillFilter(skillName) {
        if (state.activeSkillsFilters.has(skillName)) {
            state.activeSkillsFilters.delete(skillName);
        } else {
            state.activeSkillsFilters.add(skillName);
        }
        
        renderActiveFilterBadges();
        refreshData();
    }

    function renderActiveFilterBadges() {
        elements.activeFiltersContainer.innerHTML = '';
        state.activeSkillsFilters.forEach(skill => {
            const badge = document.createElement('span');
            badge.className = 'skill-tag active';
            badge.textContent = skill;
            badge.addEventListener('click', () => {
                toggleSkillFilter(skill);
            });
            elements.activeFiltersContainer.appendChild(badge);
        });
    }

    function showSkeletonLoader() {
        elements.candidatesList.innerHTML = `
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
        `;
    }

    /* ==========================================================================
       4. Upload Management (Drag & Drop + Input)
       ========================================================================== */
    function triggerBrowse() {
        elements.fileInput.click();
    }

    function handleFilesSelected(e) {
        const files = e.target.files;
        if (files.length > 0) {
            uploadFiles(files);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        elements.dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFiles(files);
        }
    }

    function uploadFiles(files) {
        Array.from(files).forEach(file => {
            const progressItem = createProgressItem(file.name);
            const formData = new FormData();
            formData.append('file', file);
            
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload', true);
            
            // Update progress bar
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    updateProgressBar(progressItem, percent);
                }
            };
            
            // Handle request load
            xhr.onload = async () => {
                if (xhr.status === 201) {
                    const response = JSON.parse(xhr.responseText);
                    markProgressItemComplete(progressItem, 'Success', 'success');
                    await refreshData(); // Refresh metrics and dashboard
                } else {
                    let errMsg = 'Failed';
                    try {
                        const errRes = JSON.parse(xhr.responseText);
                        errMsg = errRes.error || errMsg;
                    } catch(e) {}
                    markProgressItemComplete(progressItem, errMsg, 'error');
                }
            };
            
            // Handle error
            xhr.onerror = () => {
                markProgressItemComplete(progressItem, 'Connection Error', 'error');
            };
            
            xhr.send(formData);
        });
    }

    function createProgressItem(filename) {
        const item = document.createElement('div');
        item.className = 'upload-progress-item';
        item.innerHTML = `
            <div class="upload-file-details">
                <span class="upload-file-name" title="${escapeHTML(filename)}">${escapeHTML(filename)}</span>
                <span class="upload-file-status">Uploading...</span>
            </div>
            <div class="upload-progress-bar-container">
                <div class="upload-progress-bar"></div>
            </div>
        `;
        elements.uploadQueue.appendChild(item);
        return item;
    }

    function updateProgressBar(progressItem, percent) {
        const bar = progressItem.querySelector('.upload-progress-bar');
        bar.style.width = `${percent}%`;
    }

    function markProgressItemComplete(progressItem, statusText, statusClass) {
        const status = progressItem.querySelector('.upload-file-status');
        const bar = progressItem.querySelector('.upload-progress-bar');
        
        status.textContent = statusText;
        status.className = `upload-file-status ${statusClass}`;
        
        bar.style.width = '100%';
        bar.className = `upload-progress-bar ${statusClass}`;
        
        // Remove after 5 seconds
        setTimeout(() => {
            progressItem.remove();
        }, 5000);
    }

    /* ==========================================================================
       5. Drawer (Details Panel) Actions
       ========================================================================== */
    async function openCandidateDrawer(id) {
        state.currentCandidateId = id;
        try {
            const response = await fetch(`/api/candidates/${id}`);
            if (!response.ok) throw new Error('Candidate details could not be retrieved');
            const candidate = await response.json();
            
            // Fill values
            elements.drawerName.textContent = candidate.name;
            elements.drawerFilename.textContent = candidate.filename;
            elements.drawerEmail.textContent = candidate.email || 'Not specified';
            elements.drawerPhone.textContent = candidate.phone || 'Not specified';
            elements.drawerEducation.textContent = candidate.education || 'Not specified';
            elements.drawerRawText.textContent = candidate.raw_text || '';
            
            // Link download btn
            elements.drawerDownloadBtn.onclick = () => {
                window.open(`/uploads/${encodeURIComponent(candidate.filename)}`, '_blank');
            };
            
            // Bind delete button
            elements.drawerDeleteBtn.onclick = () => {
                if (confirm(`Are you sure you want to delete profile for ${candidate.name}?`)) {
                    deleteCandidate(id);
                    closeDrawer();
                }
            };
            
            // Load skills
            elements.drawerSkills.innerHTML = '';
            if (candidate.skills.length === 0) {
                elements.drawerSkills.innerHTML = '<span style="color: var(--text-muted); font-size: 13px">No skills detected</span>';
            } else {
                candidate.skills.forEach(skill => {
                    const badge = document.createElement('span');
                    badge.className = 'cand-skill-badge';
                    badge.textContent = skill;
                    elements.drawerSkills.appendChild(badge);
                });
            }
            
            // Open drawer UI
            elements.drawer.classList.add('active');
            elements.drawerOverlay.classList.add('active');
            
        } catch (err) {
            console.error('Error fetching details:', err);
            alert('Could not retrieve candidate details.');
        }
    }

    function closeDrawer() {
        elements.drawer.classList.remove('active');
        elements.drawerOverlay.classList.remove('active');
        state.currentCandidateId = null;
    }

    async function deleteCandidate(id) {
        try {
            const response = await fetch(`/api/candidates/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Delete failed');
            await refreshData();
        } catch (err) {
            console.error('Error deleting candidate:', err);
            alert('Failed to delete candidate.');
        }
    }

    /* ==========================================================================
       6. Global Event Handlers
       ========================================================================== */
    function setupEventListeners() {
        // Browse button
        elements.browseBtn.addEventListener('click', triggerBrowse);
        elements.fileInput.addEventListener('change', handleFilesSelected);
        
        // Drag and drop event listeners
        elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.dropZone.classList.add('dragover');
        });
        
        elements.dropZone.addEventListener('dragleave', () => {
            elements.dropZone.classList.remove('dragover');
        });
        
        elements.dropZone.addEventListener('drop', handleDrop);
        
        // Search Input change with simple debounce
        let searchTimeout;
        elements.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                await loadCandidates();
            }, 350);
        });

        // Drawer closing events
        elements.closeDrawerBtn.addEventListener('click', closeDrawer);
        elements.drawerOverlay.addEventListener('click', closeDrawer);
        
        // Esc key closes drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDrawer();
            }
        });
    }

    // Utility to prevent HTML Injection
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Launch Application
    init();
});
