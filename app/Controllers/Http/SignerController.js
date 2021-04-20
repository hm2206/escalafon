'use strict'

const { validateAll } = use('Validator');
const { Storage, validation } = require('validator-error-adonis');
const { Signer } = require('node-signature');
const Certificate = use('App/Models/Certificate');
const Drive = use('Drive');
const pfxLoad = require('pfx-load').default;
const Encryption = use('Encryption')
const moment = require('moment');
const Helpers = use('Helpers');

class SignerController {

    signer = async ({ params, request, response }) => {
        await validation(validateAll, request.all(), {
            reason: "required|min:3",
            location: "required",
            page: "required|number"
        });
        // obtener configuraciones
        let visible = request.input('visible', false);
        // obtener certificado
        let certificate = await Certificate.query()
            .where('state', 1)
            .where('person_id', params.id) 
            .first();
        if (!certificate) throw new Error("El certificado no existe!");
        // obtener contraseña
        let password = await Encryption.decrypt(certificate.password);
        // valdiar archivo pfx
        let pfx = await pfxLoad(certificate.file, password, { showCerts: true });
        if (pfx.isPasswordOrPfxInvalid) throw new Error("La contraseña es incorrecta, porfavor cambie su contraseña");
        // validar fecha de pfx
        let { notBefore, notAfter } = pfx.validCerts[0].validity;
        let now = moment().format('YYYY-MM-DD');
        let max = moment(notAfter).format('YYYY-MM-DD');
        let min = moment(notBefore).format('YYYY-MM-DD');
        if (!(max >= now && now >= min)) throw new Error("El certificado ya expiro!");
        // obtener archivos
        let file = await Storage.saveFile(request, "file", {
            required: true,
            extnames: ['pdf']
        }, Helpers, {
            path: `pdf/${now}`,
            options: {
                overwrite: true
            }
        });
        // validar files
        if (!file.success) throw new Error(file.message);
        try {
            // get target
            let target = `${file.realPath}`.replace('.pdf', '_signature.pdf');
            // payload
            let payload = {
                visible: visible,
                page: request.input('page', "1"),
                position: request.input('position', "0"),
                reason: request.input('reason', "Yo soy el firmante"),
                location: request.input('location', "Signer"),
                urlImage: certificate.image
            }
            // firmar
            await Signer(certificate.file, password, file.realPath, target, payload);
            // borrar archivo base
            await Drive.delete(file.realPath);
            // obtener pdf firmado
            let signed = await Drive.get(target);
            // eliminar archivo firmado
            await Drive.delete(target);
            // mostrar archivo firmado
            response.header('Content-Type', 'application/pdf')
            return response.send(signed);
        } catch (error) {
            throw new Error("No se pudo firmar el archivo pdf");
        }
    }
}

module.exports = SignerController
