import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

# --- MANDATORY ATTENDEE HEADER ---
st.set_page_config(page_title="Vibe Coding Challenge", layout="wide")
st.markdown("""
<div style="background-color:#2c2418; padding:15px; border-radius:10px; margin-bottom:25px; border-left: 5px solid #d4a574;">
    <h2 style="color:#f5e6d3; margin:0;">🚀 Vibe Coding Live!</h2>
    <p style="color:#c4a882; margin:5px 0 0 0;"><b>Attendee:</b> MP Siebert</p>
    <p style="color:#c4a882; margin:2px 0 0 0;"><b>Prompt:</b> A What-If Calculator built on Customer Support Transcripts data, tailored for Urban Planners — served in full Desert Solitude style.</p>
</div>
""", unsafe_allow_html=True)

# --- DESERT SOLITUDE STYLING ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&display=swap');
    .stApp {
        background: linear-gradient(180deg, #1a1008 0%, #2c2418 50%, #3d2e1f 100%);
        color: #f5e6d3;
    }
    h1, h2, h3 { color: #d4a574 !important; font-family: 'IBM Plex Mono', monospace; }
    .stMetric label { color: #c4a882 !important; }
    .stMetric [data-testid="stMetricValue"] { color: #f5e6d3 !important; }
    .stSelectbox label, .stSlider label, .stMultiSelect label { color: #c4a882 !important; }
    div[data-testid="stSidebar"] { background-color: #1a1008 !important; }
    div[data-testid="stSidebar"] * { color: #f5e6d3 !important; }
</style>
""", unsafe_allow_html=True)

# --- SIMULATED SUPPORT TRANSCRIPT DATA ---
@st.cache_data
def generate_data():
    np.random.seed(42)
    n = 500
    districts = ["Downtown Core", "Riverside", "Industrial East", "Suburban Heights", "Old Town", "Tech Park"]
    categories = ["Infrastructure", "Noise Complaint", "Zoning Request", "Public Transit", "Green Space", "Utilities"]
    severities = ["Low", "Medium", "High", "Critical"]
    
    data = pd.DataFrame({
        "ticket_id": range(1, n + 1),
        "district": np.random.choice(districts, n, p=[0.25, 0.15, 0.2, 0.15, 0.1, 0.15]),
        "category": np.random.choice(categories, n, p=[0.3, 0.15, 0.1, 0.2, 0.15, 0.1]),
        "severity": np.random.choice(severities, n, p=[0.3, 0.35, 0.25, 0.1]),
        "resolution_days": np.random.exponential(7, n).round(1),
        "satisfaction_score": np.clip(np.random.normal(3.5, 1.2, n), 1, 5).round(1),
        "cost_estimate": np.random.uniform(500, 50000, n).round(0),
        "month": np.random.choice(range(1, 13), n)
    })
    return data

df = generate_data()

# --- SIDEBAR CONTROLS ---
st.sidebar.markdown("### 🏜️ What-If Parameters")
st.sidebar.markdown("*Adjust these levers to simulate urban planning scenarios.*")

budget_multiplier = st.sidebar.slider(
    "Budget Multiplier", 0.5, 3.0, 1.0, 0.1,
    help="Scale available budget for issue resolution"
)

staff_increase = st.sidebar.slider(
    "Staff Increase (%)", 0, 200, 0, 10,
    help="Simulate hiring more support/field staff"
)

selected_districts = st.sidebar.multiselect(
    "Focus Districts",
    options=df["district"].unique().tolist(),
    default=df["district"].unique().tolist()
)

priority_category = st.sidebar.selectbox(
    "Priority Category",
    options=["All"] + df["category"].unique().tolist()
)

# --- FILTER DATA ---
filtered = df[df["district"].isin(selected_districts)]
if priority_category != "All":
    filtered = filtered[filtered["category"] == priority_category]

# --- WHAT-IF CALCULATIONS ---
staff_factor = 1 + (staff_increase / 100)
projected_resolution = filtered["resolution_days"] / staff_factor
projected_cost = filtered["cost_estimate"] * budget_multiplier
projected_satisfaction = np.clip(filtered["satisfaction_score"] + (staff_increase / 100) * 0.5, 1, 5)

# --- MAIN CONTENT ---
st.markdown("# 🏜️ Urban Support — What-If Calculator")
st.markdown("*Simulate resource allocation scenarios for urban district support tickets.*")

# KPI Row
col1, col2, col3, col4 = st.columns(4)
with col1:
    orig_res = filtered["resolution_days"].mean()
    new_res = projected_resolution.mean()
    st.metric("Avg Resolution (days)", f"{new_res:.1f}", f"{new_res - orig_res:.1f}")
with col2:
    orig_cost = filtered["cost_estimate"].sum()
    new_cost = projected_cost.sum()
    st.metric("Total Budget Needed", f"${new_cost:,.0f}", f"{((new_cost/orig_cost)-1)*100:.0f}%")
with col3:
    orig_sat = filtered["satisfaction_score"].mean()
    new_sat = projected_satisfaction.mean()
    st.metric("Avg Satisfaction", f"{new_sat:.1f}/5", f"+{new_sat - orig_sat:.2f}")
with col4:
    st.metric("Tickets in Scope", f"{len(filtered)}", f"of {len(df)} total")

st.markdown("---")

# Charts
chart_col1, chart_col2 = st.columns(2)

with chart_col1:
    st.markdown("### Resolution Time by District")
    district_comparison = pd.DataFrame({
        "District": filtered.groupby("district")["resolution_days"].mean().index,
        "Current (days)": filtered.groupby("district")["resolution_days"].mean().values,
        "Projected (days)": (filtered.groupby("district")["resolution_days"].mean() / staff_factor).values
    })
    fig1 = go.Figure()
    fig1.add_trace(go.Bar(
        x=district_comparison["District"],
        y=district_comparison["Current (days)"],
        name="Current",
        marker_color="#8b6914"
    ))
    fig1.add_trace(go.Bar(
        x=district_comparison["District"],
        y=district_comparison["Projected (days)"],
        name="Projected",
        marker_color="#d4a574"
    ))
    fig1.update_layout(
        barmode="group",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(44,36,24,0.8)",
        font_color="#f5e6d3",
        legend=dict(font=dict(color="#c4a882")),
        xaxis=dict(gridcolor="#3d2e1f"),
        yaxis=dict(gridcolor="#3d2e1f")
    )
    st.plotly_chart(fig1, use_container_width=True)

with chart_col2:
    st.markdown("### Cost Distribution by Category")
    cost_by_cat = filtered.groupby("category")["cost_estimate"].sum().reset_index()
    cost_by_cat["projected"] = cost_by_cat["cost_estimate"] * budget_multiplier
    fig2 = px.pie(
        cost_by_cat, values="projected", names="category",
        color_discrete_sequence=["#d4a574", "#8b6914", "#c4a882", "#5c4a2a", "#f5e6d3", "#3d2e1f"]
    )
    fig2.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        font_color="#f5e6d3",
        legend=dict(font=dict(color="#c4a882"))
    )
    st.plotly_chart(fig2, use_container_width=True)

# Severity Heatmap
st.markdown("### Severity Heatmap — Tickets by District & Category")
heatmap_data = filtered.pivot_table(index="district", columns="category", values="ticket_id", aggfunc="count", fill_value=0)
fig3 = px.imshow(
    heatmap_data,
    color_continuous_scale=["#1a1008", "#8b6914", "#d4a574", "#f5e6d3"],
    aspect="auto"
)
fig3.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(44,36,24,0.8)",
    font_color="#f5e6d3",
    xaxis=dict(title="Category", color="#c4a882"),
    yaxis=dict(title="District", color="#c4a882")
)
st.plotly_chart(fig3, use_container_width=True)

# Scenario Summary
st.markdown("---")
st.markdown("### 📋 Scenario Summary")
st.markdown(f"""
| Parameter | Value |
|-----------|-------|
| Budget Multiplier | **{budget_multiplier}x** |
| Staff Increase | **+{staff_increase}%** |
| Districts in Focus | **{len(selected_districts)}** |
| Priority Category | **{priority_category}** |
| Projected Avg Resolution | **{projected_resolution.mean():.1f} days** (was {filtered['resolution_days'].mean():.1f}) |
| Projected Satisfaction | **{projected_satisfaction.mean():.1f}/5** (was {filtered['satisfaction_score'].mean():.1f}) |
""")
