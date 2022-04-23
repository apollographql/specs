# Spec Template

## Getting Started

1. Click the "Use this template" button on this repository to create a copy of it and name the new repository `specs-{{spec_name}}`, per convention.
1. Search for usages of `%%SPEC-.*?%%` tokens within this repository and replace them with appropriate names (e.g., `%%SPEC-NAME%%`, `%%SPEC-TITLE%%` and `%%SPEC-VERSION%%`).
1. Setup the new repository with Netlify (estimated about 5 minutes)
    1. Go to [Netlify App](https://app.netlify.com/teams/apollo/sites)
    1. Click “New Site From Git” button
    1. Choose GitHub
    1. Authorize
    1. Choose `apollographql` org
    1. Search for `specs-{{spec_name}}`
      1. It probably won’t come up
    1. Choose “Configure Netlify on GitHub”
    1. On the “Install Netlify” screen choose `apollographql`
    1. Scroll to the bottom of the App page to where you see the option for “Only select repositories” inside “Repository access”
    1. Click “Select repositories”
    1. Type `specs-{{spec_name}}` again, then click the matching name.
    1. Click on “Save”
    1. Then, back on Netlify, click on “specs-tag” in the “Continuous Deployment: GitHub App” box.
    1. Leave all the defaults as they are and press “Deploy site”
    1. Click on “Site Settings”
    1. Press “Change Site Name”
    1. Type `apollo-specs-{{spec_name}}` as the name and press “Save”
    1. The site should now work at `https://apollo-specs-{{spec_name}}.netlify.app/`
    1. Click on “Build and Deploy” on the left menu
    1. Under “Branches” press “Edit Settings”
    1. Change the “Branch deploys” option to “All” and press “Save”
1. Setup proxying redirects to the new sub-spec site [on the `specs` repo](https://github.com/apollographql/specs/blob/main/_redirects).  This will make it available at `https://specs.apollo.dev/{{spec_name}}`.
1. Run `npm run dev` to watch and rebuild.  Just use a browser to view `.dist/index.html` to see the rendered page.
1. Write the actual specifications.  _Use other specifications (like [the `core` specification](https://github.com/apollographql/specs-core)) as your guide._
