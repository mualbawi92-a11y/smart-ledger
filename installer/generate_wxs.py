import os
import sys
import uuid

def get_guid(name: str) -> str:
    namespace = uuid.UUID('12345678-1234-5678-1234-567812345678')
    return str(uuid.uuid5(namespace, name)).upper()

def clean_id(val: str) -> str:
    return val.replace('-', '_').replace('.', '_').replace('/', '_').replace('\\', '_').replace('@', '_')

def generate_wxs(staging_dir: str, output_wxs: str, with_ui: bool = False):
    product_name = "Smart Ledger"
    manufacturer = "Smart Ledger"
    version = "1.0.0"
    upgrade_code = "C7B387F0-9F31-4F2A-8C39-05E8BC29B120"

    component_refs = []
    files_by_rel_dir = {}
    for root, dirs, files in os.walk(staging_dir):
        rel_dir = os.path.relpath(root, staging_dir)
        if rel_dir == '.':
            rel_dir = ''
        files_by_rel_dir[rel_dir] = sorted(files)

    def render_dir_tree(current_rel_dir):
        xml_parts = []
        subdirs = sorted([d for d in files_by_rel_dir.keys() if (os.path.dirname(d) == current_rel_dir and d != '') or (current_rel_dir == '' and os.path.dirname(d) == '' and d != '')])
        
        files = files_by_rel_dir.get(current_rel_dir, [])
        if files or (current_rel_dir == ''):
            cmp_id = f"cmp_{clean_id(current_rel_dir or 'root')}"
            guid = get_guid(cmp_id)
            component_refs.append(cmp_id)
            
            xml_parts.append(f'  <Component Id="{cmp_id}" Guid="{guid}" Win64="yes">')
            for f in files:
                rel_file_path = os.path.join(current_rel_dir, f) if current_rel_dir else f
                full_staging_file = os.path.join(staging_dir, rel_file_path).replace('/', '\\') if with_ui else os.path.join(staging_dir, rel_file_path)
                file_id = f"fil_{clean_id(rel_file_path)}"
                
                if f.lower() == "smartledger.exe" and current_rel_dir == '':
                    xml_parts.append(f'    <File Id="{file_id}" Source="{full_staging_file}" KeyPath="yes">')
                    xml_parts.append(f'      <Shortcut Id="AppDesktopShortcut" Directory="DesktopFolder" Name="Smart Ledger" WorkingDirectory="INSTALLFOLDER" Icon="AppIcon.ico" Advertise="no" />')
                    xml_parts.append(f'      <Shortcut Id="AppStartMenuShortcut" Directory="ApplicationProgramsFolder" Name="Smart Ledger" WorkingDirectory="INSTALLFOLDER" Icon="AppIcon.ico" Advertise="no" />')
                    xml_parts.append(f'    </File>')
                else:
                    xml_parts.append(f'    <File Id="{file_id}" Source="{full_staging_file}" KeyPath="no" />')
            
            if current_rel_dir == '':
                xml_parts.append('    <RegistryValue Root="HKCU" Key="Software\\SmartLedger" Name="installed" Type="integer" Value="1" KeyPath="no" />')
            
            xml_parts.append('  </Component>')

        for sd in subdirs:
            dir_name = os.path.basename(sd)
            dir_id = f"dir_{clean_id(sd)}"
            xml_parts.append(f'<Directory Id="{dir_id}" Name="{dir_name}">')
            xml_parts.extend(render_dir_tree(sd))
            xml_parts.append('</Directory>')
            
        return xml_parts

    tree_xml = "\n".join(render_dir_tree(''))
    component_refs_xml = "\n".join([f'      <ComponentRef Id="{c}" />' for c in component_refs])

    ui_block = ""
    package_platform = ""
    if with_ui:
        package_platform = 'Platform="x64"'
        ui_block = '''
    <Property Id="WIXUI_INSTALLDIR" Value="INSTALLFOLDER" />
    <Property Id="WIXUI_EXITDIALOGOPTIONALCHECKBOXTEXT" Value="تشغيل المحاسب الذكي الآن (Launch Smart Ledger now)" />
    <Property Id="WIXUI_EXITDIALOGOPTIONALCHECKBOX" Value="1" />
    <Property Id="WixShellExecTarget" Value="[#fil_SmartLedger_exe]" />
    <CustomAction Id="LaunchApplication" BinaryKey="WixCA" DllEntry="WixShellExec" Impersonate="yes" />

    <UI>
      <UIRef Id="WixUI_InstallDir" />
      <Publish Dialog="ExitDialog" 
               Control="Finish" 
               Event="DoAction" 
               Value="LaunchApplication">WIXUI_EXITDIALOGOPTIONALCHECKBOX = 1 and NOT Installed</Publish>
    </UI>

    <WixVariable Id="WixUIBannerBmp" Value="installer\\banner.bmp" />
    <WixVariable Id="WixUIDialogBmp" Value="installer\\dialog.bmp" />
    <WixVariable Id="WixUILicenseRtf" Value="installer\\license.rtf" />
'''

    icon_source = "assets\\icon.ico" if with_ui else "assets/icon.ico"

    wxs_content = f'''<?xml version="1.0" encoding="utf-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" 
           Name="{product_name}" 
           Language="1033" 
           Version="{version}" 
           Manufacturer="{manufacturer}" 
           UpgradeCode="{upgrade_code}">
    
    <Package InstallerVersion="301" 
             Compressed="yes" 
             InstallScope="perMachine" 
             {package_platform}
             Description="Smart Ledger Accounting System Installation Package"
             Comments="Professional Accounting Software for Windows 10 and 11" />

    <MajorUpgrade DowngradeErrorMessage="A newer version of [ProductName] is already installed." Schedule="afterInstallInitialize" />

    <MediaTemplate EmbedCab="yes" />

    <Icon Id="AppIcon.ico" SourceFile="{icon_source}" />
    <Property Id="ARPPRODUCTICON" Value="AppIcon.ico" />
    <Property Id="ARPHELPLINK" Value="http://localhost:3000" />
    <Property Id="ARPURLINFOABOUT" Value="http://localhost:3000" />
    <Property Id="ARPNOREPAIR" Value="1" />
{ui_block}
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFiles64Folder">
        <Directory Id="INSTALLFOLDER" Name="Smart Ledger">
{tree_xml}
        </Directory>
      </Directory>

      <Directory Id="ProgramMenuFolder">
        <Directory Id="ApplicationProgramsFolder" Name="Smart Ledger">
          <Component Id="cmp_StartMenuShortcut" Guid="{get_guid('cmp_StartMenuShortcut')}" Win64="yes">
            <RemoveFolder Id="CleanUpAppProgramsFolder" Directory="ApplicationProgramsFolder" On="uninstall" />
            <RegistryValue Root="HKCU" Key="Software\\SmartLedger" Name="startmenu_installed" Type="integer" Value="1" KeyPath="yes" />
          </Component>
        </Directory>
      </Directory>

      <Directory Id="DesktopFolder" Name="Desktop" />
    </Directory>

    <Feature Id="MainApplication" Title="Smart Ledger" Level="1" Display="expand" ConfigurableDirectory="INSTALLFOLDER">
      <ComponentRef Id="cmp_StartMenuShortcut" />
{component_refs_xml}
    </Feature>
  </Product>
</Wix>
'''

    with open(output_wxs, 'w', encoding='utf-8') as f:
        f.write(wxs_content)
    print(f"Generated {output_wxs} (with_ui={with_ui}) with {len(component_refs)} components.")

if __name__ == '__main__':
    staging = sys.argv[1] if len(sys.argv) > 1 else 'staging'
    output = sys.argv[2] if len(sys.argv) > 2 else 'installer/Product.wxs'
    with_ui_flag = '--with-ui' in sys.argv
    generate_wxs(staging, output, with_ui=with_ui_flag)
