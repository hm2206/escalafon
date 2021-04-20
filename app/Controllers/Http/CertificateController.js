'use strict'

const { validateAll } = use('Validator');
const { validation, Storage } = require('validator-error-adonis');
const Helpers = use('Helpers');
const Encryption = use('Encryption')
const Certificate = use('App/Models/Certificate')
const Drive = use('Drive');
const pfxLoad = require('pfx-load').default;
const { execSync } = require('child_process');


class CertificateController {

    store = async ({ request }) => {
        await validation(validateAll, request.all(), {
            person_id: "required",
            password: "required|min:6|max:12|confirmed"
        });
        // validar si existe el certificado
        let certificate = await Certificate.findBy('person_id', request.input('person_id'));
        if (certificate) throw new Error("La persona ya tiene un certificado pfx");
        // validar file
        let file = await Storage.saveFile(request, "pfx", {
            required: true,
            size: '2mb',
            extnames: ['pfx']
        }, Helpers, {
            path: `certificate/person_${request.input('person_id')}`,
            options: { 
                overwrite: true
            }
        })
        // validar pfx
        const obj = await pfxLoad(file.realPath, request.input('password'))
        if (obj.isPasswordOrPfxInvalid) {
            await Drive.delete(file.realPath);
            throw new Error("La contraseña no pertenece al certificado pfx");
        }
        // guaradar imagen
        let image = await Storage.saveFile(request, "image", {
            required: true,
            size: '2mb',
            extnames: ['png', 'jpg', 'jpeg']
        }, Helpers, {
            path: `certificate/person_${request.input('person_id')}/image`,
            options: { 
                overwrite: true
            }
        })
        // reducir imagen
        const command = `convert ${image.realPath} -resize 100x100 ${image.realPath}`;
        execSync(command);
        // generar payload
        let payload = {
            person_id: request.input('person_id'),
            password: Encryption.encrypt(request.input('password')),
            file: file.realPath,
            image: image.realPath
        };
        // guardar datos
        certificate = await Certificate.create(payload);
        // response
        return {
            success: true,
            status: 201,
            message: "Los datos se crearon correctamente!",
            certificate
        }
    }

    download = async ({ params, response }) => {
        let certificate = await Certificate.findBy('person_id', params.id);
        if (!certificate) throw new Error("No se encontró el certificado pfx");
        if (!await Drive.exists(certificate.file)) throw new Error("No se encontró el pfx");
        return response.download(certificate.file);
    }

}

module.exports = CertificateController
